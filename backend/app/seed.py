from .database import Base, engine, SessionLocal
from .models import Form, Question, Response, Answer
import json


def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()

    if db.query(Form).count():
        return

    def make(title, status, qs):
        f = Form(
            title=title,
            public_id='feedback2026' if title.startswith('Customer') else 'event2026',
            status=status,
        )
        db.add(f)
        db.flush()

        made = []
        for i, (t, txt, opts) in enumerate(qs):
            q = Question(
                form_id=f.id,
                position=i,
                type=t,
                title=txt,
                description='',
                required=i < 2,
                settings=json.dumps({'options': opts} if opts else {}),
            )
            db.add(q)
            made.append(q)

        db.flush()

        for values in [
            ['5', 'Very satisfied', 'The support team was wonderful', 'I would love a dark mode', 'sam@example.com', 'Yes'],
            ['4', 'Satisfied', 'Great product', 'Keep it simple', 'jordan@example.com', 'Yes'],
        ]:
            r = Response(form_id=f.id)
            db.add(r)
            db.flush()
            for q, v in zip(made, values):
                db.add(Answer(response_id=r.id, question_id=q.id, value=v))

    make(
        'Customer Feedback',
        'published',
        [
            ('rating', 'How would you rate your experience?', ['1', '2', '3', '4', '5']),
            ('multiple_choice', 'How satisfied are you?', ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied']),
            ('short_text', 'What did we do well?', None),
            ('long_text', 'What could we improve?', None),
            ('email', 'Where can we follow up?', None),
            ('yes_no', 'Would you recommend us?', ['Yes', 'No']),
        ],
    )

    make(
        'Event Registration',
        'draft',
        [
            ('short_text', 'What is your full name?', None),
            ('email', 'What is your email?', None),
            ('dropdown', 'Which session interests you most?', ['Design', 'Engineering', 'Growth']),
            ('number', 'How many guests?', None),
        ],
    )

    db.commit()
    db.close()


if __name__ == '__main__':
    seed()
