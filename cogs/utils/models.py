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


class RoleReact(Document):
    guild = LongField(required=True)
    channel = LongField(required=True)
    message = LongField(required=True, unique=True)
    name = StringField(required=True, unique=True)
    options = MapField(field=LongField())


class Poll(Document):
    guild = LongField(required=True)
    channel = LongField(required=True)
    message = LongField(required=True, unique=True)
    options = ListField(field=StringField())
    votes = MapField(field=IntField())


class Suggestion(Document):
    mal_id = IntField(required=True, unique=True)
    title = StringField(required=True)
    message = LongField(required=True, unique=True)
    votes = MapField(field=BooleanField())
