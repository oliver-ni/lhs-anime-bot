from mongoengine import Document, LongField, IntField, StringField, ReferenceField, DateTimeField, BooleanField, CASCADE


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

