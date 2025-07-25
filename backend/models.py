from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    username: str
    hashed_password: str 