import re
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from pydantic.alias_generators import to_camel
from typing import List, Optional
from datetime import datetime

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# --- AUTH SCHEMAS ---
class LoginRequest(CamelModel):
    username: str
    password: str
    role: Optional[str] = "Employee"

class TokenResponse(CamelModel):
    access_token: str
    token_type: str
    user: dict

class ChangePasswordRequest(CamelModel):
    current_password: str
    new_password: str

class VerifyPasswordRequest(CamelModel):
    password: str

class ForgotPasswordRequest(CamelModel):
    identifier: str

class VerifyOtpRequest(CamelModel):
    identifier: str
    otp: str

class ResetPasswordRequest(CamelModel):
    identifier: str
    otp: str
    new_password: str

class SignUpRequestOtp(CamelModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_signup_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith('@quadrantitservices.com'):
            raise ValueError('Registration is restricted to official company emails ending with @quadrantitservices.com')
        if not re.match(r'^[a-zA-Z0-9._%+-]+@quadrantitservices\.com$', v):
            raise ValueError('Please enter a valid company email address (e.g. employee@quadrantitservices.com)')
        return v

class SignUpVerifyOtp(CamelModel):
    email: str
    otp: str

    @field_validator('email')
    @classmethod
    def validate_verify_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith('@quadrantitservices.com'):
            raise ValueError('Registration is restricted to official company emails ending with @quadrantitservices.com')
        return v

class EmployeeSignUpRequest(CamelModel):
    name: str
    email: str
    otp: str
    password: str
    department: Optional[str] = "Unassigned"
    designation: Optional[str] = "Unassigned"
    id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = "Hyderabad, India"

    @field_validator('id')
    @classmethod
    def validate_employee_id(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            v = v.strip().upper()
            if not re.match(r'^[A-Z0-9_-]{3,20}$', v):
                raise ValueError('Employee ID must be between 3 and 20 alphanumeric characters (e.g. QEMP001, EMP101, 121234)')
            return v
        return None

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not v.endswith('@quadrantitservices.com'):
            raise ValueError('Registration is restricted to official company emails ending with @quadrantitservices.com')
        if not re.match(r'^[a-zA-Z0-9._%+-]+@quadrantitservices\.com$', v):
            raise ValueError('Please enter a valid company email address (e.g. employee@quadrantitservices.com)')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean_v = re.sub(r'\D', '', v)
            if len(clean_v) == 12 and clean_v.startswith('91'):
                clean_v = clean_v[2:]
            if len(clean_v) < 10 or len(clean_v) > 13:
                raise ValueError('Phone number must be between 10 to 13 digits')
            return clean_v
        return v


# --- EMPLOYEE SCHEMAS ---
class EmployeeBase(CamelModel):
    id: str
    name: str
    department: str
    designation: str
    email: str
    username: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "Active"
    role: Optional[str] = "Employee"
    avatar: Optional[str] = None
    joining_date: Optional[str] = None
    location: Optional[str] = "Hyderabad, India"

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import re

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = None

    @field_validator('id')
    @classmethod
    def validate_id_format(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.match(r'^[A-Z0-9_-]{3,20}$', v):
            raise ValueError('Employee ID must be between 3 and 20 alphanumeric characters (e.g. QEMP001, EMP101, 121234)')
        return v

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Please enter a valid email address (e.g. employee@company.com)')
        return v

class EmployeeUpdate(CamelModel):
    name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    joining_date: Optional[str] = None
    location: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip().lower()
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
                raise ValueError('Please enter a valid email address (e.g. employee@company.com)')
            return v
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean_v = re.sub(r'\D', '', v)
            if len(clean_v) == 12 and clean_v.startswith('91'):
                clean_v = clean_v[2:]
            if len(clean_v) < 10 or len(clean_v) > 13:
                raise ValueError('Phone number must be between 10 to 13 digits')
            return clean_v
        return v

class EmployeeOut(EmployeeBase):
    created_at: Optional[datetime] = None

class EmployeeBulkDeleteRequest(CamelModel):
    employee_ids: List[str]

# --- CATEGORY SCHEMAS ---
class CategoryBase(CamelModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    group: str  # IT, Non-IT
    scope: str  # Employee, Organization
    owner_entity: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None
    group: Optional[str] = None
    scope: Optional[str] = None
    owner_entity: Optional[str] = None

class CategoryOut(CamelModel):
    id: str
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    group: str
    scope: str
    owner_entity: str
    created_at: Optional[datetime] = None


# --- ASSET SCHEMAS ---
class AssetBase(CamelModel):
    id: str
    type: str
    brand: str
    model: str
    serial_number: str
    status: Optional[str] = "Available"
    ownership: Optional[str] = "Quadrant IT Services"
    group: Optional[str] = "IT"
    charger_serial_number: Optional[str] = "N/A"
    condition: Optional[str] = "Good"
    assigned_to: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_end_date: Optional[str] = None
    assigned_date: Optional[str] = "N/A"
    assigned_at: Optional[datetime] = None
    acceptance_status: Optional[str] = "Accepted"
    image: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(CamelModel):
    type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    ownership: Optional[str] = None
    group: Optional[str] = None
    charger_serial_number: Optional[str] = None
    condition: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_end_date: Optional[str] = None
    assigned_date: Optional[str] = None
    assigned_at: Optional[datetime] = None
    acceptance_status: Optional[str] = None
    image: Optional[str] = None

class AssetOut(AssetBase):
    created_at: Optional[datetime] = None

class AssetHistoryOut(CamelModel):
    id: Optional[int] = None
    asset_id: str
    action: str
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    performed_by: str
    date: str
    condition: Optional[str] = None
    remarks: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

class AssetAssignmentHistoryOut(CamelModel):
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    employee_department: Optional[str] = None
    assigned_date: Optional[str] = None
    returned_date: Optional[str] = None
    condition: Optional[str] = "Good"
    remarks: Optional[str] = None
    status: Optional[str] = "Active"  # Active, Returned

class AssetFullHistoryResponse(CamelModel):
    asset: AssetOut
    current_assigned_employee: Optional[dict] = None
    timeline: List[AssetHistoryOut] = []
    assignments: List[AssetAssignmentHistoryOut] = []
    repairs: List[dict] = []

class AssetAssignRequest(CamelModel):
    employee_id: str
    asset_ids: List[str]
    assign_date: Optional[str] = None
    remarks: Optional[str] = None

class AssetReturnRequest(CamelModel):
    employee_id: str
    asset_ids: List[str]
    return_date: Optional[str] = None
    condition: Optional[str] = "Good"
    remarks: Optional[str] = None

class AssetAcceptRejectRequest(CamelModel):
    reason: Optional[str] = None

class AssetBulkDeleteRequest(CamelModel):
    asset_ids: List[str]

# --- SUBSCRIPTION GROUP SCHEMAS ---
class SubscriptionGroupBase(CamelModel):
    name: str
    description: Optional[str] = None
    vendor: Optional[str] = "Subscription"

class SubscriptionGroupCreate(SubscriptionGroupBase):
    id: Optional[str] = None

class SubscriptionGroupUpdate(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    vendor: Optional[str] = None

class SubscriptionGroupOut(SubscriptionGroupBase):
    id: str
    created_at: Optional[datetime] = None
    plans_count: Optional[int] = 0
    assigned_employees_count: Optional[int] = 0
    expiring_soon_count: Optional[int] = 0

# --- LICENSE SCHEMAS ---
class LicenseBase(CamelModel):
    name: str
    status: Optional[str] = "Available"
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    vendor: Optional[str] = "Subscription"
    license_key: Optional[str] = "N/A"
    seats: Optional[int] = 1
    cost: Optional[str] = "N/A"
    start_date: Optional[str] = None
    end_date: str
    alert_days_before: Optional[int] = 30
    admin_email: str
    description: Optional[str] = None

class LicenseCreate(LicenseBase):
    id: Optional[str] = None
    assigned_employee_ids: Optional[List[str]] = None

class LicenseUpdate(CamelModel):
    name: Optional[str] = None
    status: Optional[str] = None
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    vendor: Optional[str] = None
    license_key: Optional[str] = None
    seats: Optional[int] = None
    cost: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    alert_days_before: Optional[int] = None
    admin_email: Optional[str] = None
    description: Optional[str] = None
    assigned_employee_ids: Optional[List[str]] = None

class LicenseOut(LicenseBase):
    id: str
    created_at: Optional[datetime] = None
    assigned_employees: Optional[List[dict]] = []
    assigned_count: Optional[int] = 0

class LicenseRenewRequest(CamelModel):
    start_date: Optional[str] = None
    end_date: str
    alert_days_before: Optional[int] = 30
    vendor: Optional[str] = None
    cost: Optional[str] = None
    seats: Optional[int] = None
    notes: Optional[str] = None

class LicenseCancelRequest(CamelModel):
    reason: Optional[str] = None

class LicenseAssignRequest(CamelModel):
    employee_ids: List[str]


# --- REPAIR SCHEMAS ---
class RepairUpdateSchema(CamelModel):
    status: str
    message: str

class RepairCreate(CamelModel):
    asset_id: Optional[str] = None
    reported_by: str
    issue: str
    description: Optional[str] = ""
    priority: Optional[str] = "Medium"
    assigned_to: Optional[str] = "IT Support Team"
    estimated_completion: Optional[str] = "Awaiting inspection"

class RepairUpdateOut(CamelModel):
    id: int
    repair_id: str
    date: str
    message: str
    created_at: Optional[datetime] = None

class RepairOut(CamelModel):
    id: str
    asset_id: Optional[str] = None
    reported_by: Optional[str] = None
    issue: str
    description: Optional[str] = None
    request_date: str
    priority: str
    assigned_to: Optional[str] = None
    estimated_completion: Optional[str] = None
    status: str
    accepted_by: Optional[str] = None
    accepted_date: Optional[str] = None
    updates: List[RepairUpdateOut] = []
    created_at: Optional[datetime] = None

# --- SOFTWARE TICKET SCHEMAS ---
class SoftwareTicketUpdateSchema(CamelModel):
    status: Optional[str] = None
    message: str

class SoftwareTicketCreate(CamelModel):
    reported_by: str
    issue: str
    description: Optional[str] = ""
    working_mode: Optional[str] = "Onsite"
    priority: Optional[str] = "Medium"
    assigned_to: Optional[str] = "IT Support Team"

class SoftwareTicketUpdateOut(CamelModel):
    id: int
    ticket_id: str
    date: str
    message: str
    created_at: Optional[datetime] = None

class SoftwareTicketOut(CamelModel):
    id: str
    reported_by: Optional[str] = None
    issue: str
    description: Optional[str] = None
    working_mode: Optional[str] = "Onsite"
    request_date: str
    priority: str
    assigned_to: Optional[str] = None
    status: str
    accepted_by: Optional[str] = None
    accepted_date: Optional[str] = None
    updates: List[SoftwareTicketUpdateOut] = []
    created_at: Optional[datetime] = None

# --- ANNOUNCEMENT SCHEMAS ---
class AnnouncementBase(CamelModel):
    title: str
    message: str
    type: Optional[str] = "General"
    priority: Optional[str] = "Medium"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementOut(AnnouncementBase):
    id: str
    date: str
    author: str
    created_at: Optional[datetime] = None

# --- GUIDELINE SCHEMAS ---
class GuidelineBase(CamelModel):
    title: str
    version: str
    summary: Optional[str] = None
    content: Optional[str] = None
    file_name: Optional[str] = None
    size: Optional[str] = None
    download_url: Optional[str] = None

class GuidelineUpdate(CamelModel):
    title: Optional[str] = None
    version: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    file_name: Optional[str] = None
    size: Optional[str] = None
    download_url: Optional[str] = None

class GuidelineOut(GuidelineBase):
    id: str
    uploaded_date: str
    created_at: Optional[datetime] = None

# --- NOTIFICATION SCHEMAS ---
class NotificationBase(CamelModel):
    title: str
    message: str
    type: str  # info, success, warning, danger, alert
    employee_id: Optional[str] = None

class NotificationOut(NotificationBase):
    id: str
    time: str
    read: bool
    created_at: Optional[datetime] = None

# --- ACTIVITY LOG SCHEMAS ---
class ActivityLogOut(CamelModel):
    id: str
    user: str
    activity: str
    details: str
    ip_address: str
    date_time: str
    created_at: Optional[datetime] = None

class ActivityLogCreate(CamelModel):
    activity: str
    details: str

# --- DEPARTMENT SCHEMAS ---
class DepartmentCreate(CamelModel):
    name: str
