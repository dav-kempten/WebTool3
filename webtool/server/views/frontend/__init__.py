# -*- coding: utf-8 -*-
from .names import NamesViewSet
from .values import ValuesViewSet
from .calendars import CalendarsViewSet
from .instructions import InstructionViewSet
from .tours import TourViewSet
from .talks import TalkViewSet
from .sessions import SessionViewSet
from .tourcalendar import TourcalendarViewSet
from .instructioncalendar import InstructioncalendarViewSet
# from .retrainings import RetrainingViewSet
# from .qualifications import UserQualificationViewSet
from .guides import GuideViewSet
from .urls import router as frontend_router
