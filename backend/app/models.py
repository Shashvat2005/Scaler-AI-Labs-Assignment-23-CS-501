from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Form(Base):
    __tablename__ = 'forms'

    id = Column(Integer, primary_key=True)
    title = Column(String(180), nullable=False, default='Untitled form')
    public_id = Column(String(16), unique=True, index=True, nullable=False)
    status = Column(String(16), default='draft')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    questions = relationship(
        'Question', cascade='all, delete-orphan', back_populates='form', order_by='Question.position'
    )
    responses = relationship('Response', cascade='all, delete-orphan', back_populates='form')


class Question(Base):
    __tablename__ = 'questions'

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey('forms.id'), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    type = Column(String(30), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, default='')
    required = Column(Boolean, default=False)
    settings = Column(Text, default='{}')

    form = relationship('Form', back_populates='questions')
    answers = relationship('Answer', cascade='all, delete-orphan', back_populates='question')

    __table_args__ = (Index('ix_question_form_position', 'form_id', 'position'),)


class Response(Base):
    __tablename__ = 'responses'

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey('forms.id'), nullable=False, index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship('Form', back_populates='responses')
    answers = relationship('Answer', cascade='all, delete-orphan', back_populates='response')


class Answer(Base):
    __tablename__ = 'answers'

    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey('responses.id'), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    value = Column(Text, nullable=False)

    response = relationship('Response', back_populates='answers')
    question = relationship('Question', back_populates='answers')

    __table_args__ = (
        UniqueConstraint('response_id', 'question_id', name='uq_answer_response_question'),
    )
