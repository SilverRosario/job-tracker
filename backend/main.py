from contextlib import asynccontextmanager
from datetime import date
from enum import Enum
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, col, create_engine, or_, select


# ---------- Models ----------

class Status(str, Enum):
    wishlist = "wishlist"
    applied = "applied"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class ApplicationBase(SQLModel):
    company: str
    role: str
    status: Status = Status.wishlist
    url: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[date] = None


class Application(ApplicationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class ApplicationUpdate(SQLModel):
    """All fields optional so PATCH can change just one thing."""
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Status] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[date] = None


# ---------- Database ----------

engine = create_engine(
    "sqlite:///applications.db",
    connect_args={"check_same_thread": False},
)


def get_session():
    with Session(engine) as session:
        yield session


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)  # creates the table on first run
    yield


# ---------- App ----------

app = FastAPI(title="Job Application Tracker", lifespan=lifespan)

# Lets the React dev server (Vite runs on port 5173) call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/applications", response_model=list[Application])
def list_applications(
    status: Optional[Status] = None,
    q: Optional[str] = None,
    session: Session = Depends(get_session),
):
    query = select(Application)
    if status:
        query = query.where(Application.status == status)
    if q:
        query = query.where(
            or_(
                col(Application.company).contains(q),
                col(Application.role).contains(q),
            )
        )
    return session.exec(query.order_by(col(Application.id).desc())).all()


@app.post("/applications", response_model=Application, status_code=201)
def create_application(
    payload: ApplicationBase, session: Session = Depends(get_session)
):
    application = Application.model_validate(payload)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@app.get("/applications/{application_id}", response_model=Application)
def get_application(application_id: int, session: Session = Depends(get_session)):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@app.patch("/applications/{application_id}", response_model=Application)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    session: Session = Depends(get_session),
):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(application, field, value)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@app.delete("/applications/{application_id}", status_code=204)
def delete_application(application_id: int, session: Session = Depends(get_session)):
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    session.delete(application)
    session.commit()
