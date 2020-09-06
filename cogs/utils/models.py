from mongoengine.document import Document, EmbeddedDocument
from mongoengine.fields import *
from mongoengine.queryset import CASCADE


class Member(Document):
    id = LongField(primary_key=True, required=True)
    guest = BooleanField(default=False)
    email = StringField(required=False)
    name = StringField(required=False)
    classof = IntField(required=False)


class LoggedAction(Document):
    guild = LongField(required=True)
    channel = LongField(required=True)
    member = LongField(required=True)
    time = DateTimeField(required=True)
    action = StringField(choices=("edit", "delete"), required=True)
    before = StringField(required=True)
    after = StringField()


class BracketMatch(EmbeddedDocument):
    first = StringField(required=True)
    second = StringField(required=True)
    votes = MapField(field=BooleanField())


class BracketRound(Document):
    name = StringField(required=True, unique=True)
    matches = EmbeddedDocumentListField(BracketMatch)
    active = BooleanField(default=False, required=True)


class RoleReact(Document):
    guild = LongField(required=True)
    channel = LongField(required=True)
    message = LongField(required=True, unique=True)
    name = StringField(required=True, unique=True)
    options = MapField(field=LongField())
