from mongoengine import Document, LongField, IntField, StringField, ReferenceField, DateTimeField, CASCADE


class Member(Document):
    id = LongField(primary_key=True, required=True)
    xp = IntField(min_value=0, default=0)
    balance = IntField(min_value=0, default=0)


class TempAction(Document):
    guild = LongField(required=True)
    member = ReferenceField(Member, reverse_delete_rule=CASCADE, required=True)
    action = StringField(choices=("mute", "ban"), required=True)
    expires = DateTimeField(required=True)
