from mongoengine.document import Document, EmbeddedDocument
from mongoengine.fields import *
from mongoengine.queryset import CASCADE


class Member(Document):
    id = LongField(primary_key=True, required=True)
    xp = IntField(min_value=0, default=0)
    balance = IntField(min_value=0, default=0)
    muted = BooleanField(default=False)


class TempAction(Document):
    guild = LongField(required=True)
    member = ReferenceField(Member, reverse_delete_rule=CASCADE, required=True)
    action = StringField(choices=("mute", "ban"), required=True)
    expires = DateTimeField(required=True)


class LoggedAction(Document):
    guild = LongField(required=True)
    channel = LongField(required=True)
    member = ReferenceField(Member, reverse_delete_rule=CASCADE, required=True)
    time = DateTimeField(required=True)
    action = StringField(choices=("edit", "delete"), required=True)
    before = StringField(required=True)
    after = StringField()


class GuildSettings(Document):
    id = LongField(primary_key=True, required=True)
    allow_profanity = BooleanField(default=True, required=True)


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
