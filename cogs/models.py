from mongoengine import Document, StringField, IntField, LongField


class Member(Document):
    id = LongField(primary_key=True, required=True)
    xp = IntField(min_value=0, default=0)
    balance = IntField(min_value=0, default=0)
