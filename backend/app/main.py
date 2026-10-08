import json
import secrets
import re
from typing import Literal

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .database import Base, engine, get_db
from .models import Form, Question, Response, Answer
from .config import get_settings


settings = get_settings()

app = FastAPI(title='Typeflow API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=['*'],
    allow_headers=['*'],
)

TYPES = {'short_text', 'long_text', 'multiple_choice', 'dropdown', 'email', 'number', 'yes_no', 'rating'}


class FormIn(BaseModel):
    title: str = Field(min_length=1, max_length=180)


class QuestionIn(BaseModel):
    type: str
    title: str = Field(min_length=1, max_length=500)
    description: str = ''
    required: bool = False
    settings: dict = {}


class ReorderIn(BaseModel):
    question_ids: list[int]


class SubmitIn(BaseModel):
    answers: dict[str, str]


def pid() -> str:
    return secrets.token_urlsafe(8).replace('-', 'a').replace('_', 'b')[:12]


def form_data(f, include_responses=False):
    d = {
        'id': f.id,
        'title': f.title,
        'public_id': f.public_id,
        'status': f.status,
        'created_at': f.created_at,
        'updated_at': f.updated_at,
        'response_count': len(f.responses),
        'questions': [q_data(q) for q in f.questions],
    }
    return d


def q_data(q):
    return {
        'id': q.id,
        'form_id': q.form_id,
        'position': q.position,
        'type': q.type,
        'title': q.title,
        'description': q.description,
        'required': q.required,
        'settings': json.loads(q.settings or '{}'),
    }


def get_form(db, id):
    f = db.query(Form).options(
        joinedload(Form.questions), joinedload(Form.responses)
    ).filter(Form.id == id).first()
    if not f:
        raise HTTPException(404, 'Form not found')
    return f


@app.get('/api/health')
def health():
    return {'ok': True}


@app.get('/api/forms')
def list_forms(db: Session = Depends(get_db)):
    return [
        form_data(x)
        for x in db.query(Form).options(
            joinedload(Form.questions), joinedload(Form.responses)
        ).order_by(Form.updated_at.desc()).all()
    ]


@app.post('/api/forms', status_code=201)
def create_form(data: FormIn, db: Session = Depends(get_db)):
    f = Form(title=data.title, public_id=pid())
    db.add(f)
    db.commit()
    db.refresh(f)
    return form_data(f)


@app.get('/api/forms/{id}')
def read_form(id: int, db: Session = Depends(get_db)):
    return form_data(get_form(db, id))


@app.put('/api/forms/{id}')
def update_form(id: int, data: FormIn, db: Session = Depends(get_db)):
    f = get_form(db, id)
    f.title = data.title
    db.commit()
    return form_data(get_form(db, id))


@app.delete('/api/forms/{id}', status_code=204)
def delete_form(id: int, db: Session = Depends(get_db)):
    db.delete(get_form(db, id))
    db.commit()


@app.post('/api/forms/{id}/duplicate', status_code=201)
def duplicate(id: int, db: Session = Depends(get_db)):
    f = get_form(db, id)
    n = Form(title=f'{f.title} (copy)', public_id=pid())
    db.add(n)
    db.flush()
    for q in f.questions:
        db.add(Question(
            form_id=n.id,
            position=q.position,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            settings=q.settings,
        ))
    db.commit()
    return form_data(get_form(db, n.id))


@app.post('/api/forms/{id}/publish')
def publish(id: int, db: Session = Depends(get_db)):
    f = get_form(db, id)
    f.status = 'published'
    db.commit()
    return form_data(get_form(db, id))


@app.post('/api/forms/{id}/unpublish')
def unpublish(id: int, db: Session = Depends(get_db)):
    f = get_form(db, id)
    f.status = 'draft'
    db.commit()
    return form_data(get_form(db, id))


@app.post('/api/forms/{id}/questions', status_code=201)
def add_question(id: int, data: QuestionIn, db: Session = Depends(get_db)):
    if data.type not in TYPES:
        raise HTTPException(422, 'Unsupported question type')
    f = get_form(db, id)
    q = Question(
        form_id=id,
        position=len(f.questions),
        **data.model_dump(exclude={'settings'}),
        settings=json.dumps(data.settings),
    )
    db.add(q)
    db.commit()
    return q_data(q)


@app.put('/api/questions/{qid}')
def update_question(qid: int, data: QuestionIn, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(404, 'Question not found')
    if data.type not in TYPES:
        raise HTTPException(422, 'Unsupported question type')
    for k, v in data.model_dump(exclude={'settings'}).items():
        setattr(q, k, v)
    q.settings = json.dumps(data.settings)
    db.commit()
    return q_data(q)


@app.delete('/api/questions/{qid}', status_code=204)
def delete_question(qid: int, db: Session = Depends(get_db)):
    q = db.get(Question, qid)
    if not q:
        raise HTTPException(404, 'Question not found')
    fid = q.form_id
    db.delete(q)
    db.flush()
    for i, x in enumerate(
        db.query(Question).filter_by(form_id=fid).order_by(Question.position)
    ):
        x.position = i
    db.commit()


@app.put('/api/forms/{id}/questions/reorder')
def reorder(id: int, data: ReorderIn, db: Session = Depends(get_db)):
    f = get_form(db, id)
    existing = {q.id: q for q in f.questions}
    if set(data.question_ids) != set(existing):
        raise HTTPException(422, 'Question list does not match form')
    for i, qid in enumerate(data.question_ids):
        existing[qid].position = i
    db.commit()
    return [q_data(q) for q in get_form(db, id).questions]


@app.get('/api/public/forms/{public_id}')
def public_form(public_id: str, preview: bool = False, db: Session = Depends(get_db)):
    query = db.query(Form).options(joinedload(Form.questions)).filter(Form.public_id == public_id)
    if not preview:
        query = query.filter(Form.status == 'published')
    f = query.first()
    if not f:
        raise HTTPException(404, 'This form is unavailable')
    return {
        'title': f.title,
        'public_id': f.public_id,
        'preview': preview,
        'questions': [q_data(q) for q in f.questions],
    }


def valid(q, val):
    if q.required and not val.strip():
        return 'This question is required'
    if not val.strip():
        return None
    if q.type == 'email' and not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', val):
        return 'Enter a valid email address'
    if q.type == 'number':
        try:
            float(val)
        except ValueError:
            return 'Enter a valid number'
    if q.type in {'multiple_choice', 'dropdown', 'yes_no', 'rating'}:
        choices = json.loads(q.settings or '{}').get(
            'options', ['Yes', 'No'] if q.type == 'yes_no' else []
        )
        if choices and val not in [str(x) for x in choices]:
            return 'Choose a valid option'
    return None


@app.post('/api/public/forms/{public_id}/responses', status_code=201)
def submit(public_id: str, data: SubmitIn, db: Session = Depends(get_db)):
    f = db.query(Form).options(joinedload(Form.questions)).filter(
        Form.public_id == public_id, Form.status == 'published'
    ).first()
    if not f:
        raise HTTPException(404, 'This form is unavailable')
    errors = {}
    for q in f.questions:
        e = valid(q, data.answers.get(str(q.id), ''))
        if e:
            errors[str(q.id)] = e
    if errors:
        raise HTTPException(422, {'message': 'Please fix your answers', 'errors': errors})
    r = Response(form_id=f.id)
    db.add(r)
    db.flush()
    for q in f.questions:
        value = data.answers.get(str(q.id), '').strip()
        if value:
            db.add(Answer(response_id=r.id, question_id=q.id, value=value))
    db.commit()
    return {'id': r.id, 'message': 'Response submitted'}


@app.get('/api/forms/{id}/responses')
def responses(id: int, db: Session = Depends(get_db)):
    get_form(db, id)
    rs = db.query(Response).options(joinedload(Response.answers)).filter_by(
        form_id=id
    ).order_by(Response.submitted_at.desc()).all()
    return [
        {
            'id': r.id,
            'submitted_at': r.submitted_at,
            'answers': {str(a.question_id): a.value for a in r.answers}
        }
        for r in rs
    ]


@app.get('/api/forms/{id}/responses/{rid}')
def response(id: int, rid: int, db: Session = Depends(get_db)):
    r = db.query(Response).options(joinedload(Response.answers)).filter_by(
        id=rid, form_id=id
    ).first()
    if not r:
        raise HTTPException(404, 'Response not found')
    return {
        'id': r.id,
        'submitted_at': r.submitted_at,
        'answers': {str(a.question_id): a.value for a in r.answers}
    }


@app.get('/api/forms/{id}/statistics')
def statistics(id: int, db: Session = Depends(get_db)):
    f = get_form(db, id)
    out = []
    for q in f.questions:
        vals = [
            a.value for a in db.query(Answer).join(Response).filter(
                Answer.question_id == q.id, Response.form_id == id
            ).all()
        ]
        item = {'question_id': q.id, 'count': len(vals)}
        if q.type in {'multiple_choice', 'dropdown', 'yes_no', 'rating'}:
            item['distribution'] = {v: vals.count(v) for v in sorted(set(vals))}
        out.append(item)
    return {'response_count': len(f.responses), 'questions': out}


Base.metadata.create_all(bind=engine)
