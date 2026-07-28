-- ============================================================
-- HR Portal — Complete MySQL Schema
-- Runs automatically on first container start (docker-entrypoint-initdb.d)
-- ============================================================

CREATE DATABASE IF NOT EXISTS hr_portal;
USE hr_portal;

-- ============================================================
-- 1. USERS — login accounts for both HR and Employees
-- ============================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            ENUM('hr', 'employee') NOT NULL DEFAULT 'employee',
    account_status  ENUM('pending', 'active', 'disabled') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. EMPLOYEES — profile data, linked 1:1 to a user account
-- ============================================================
CREATE TABLE employees (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL UNIQUE,
    employee_code       VARCHAR(50) NOT NULL UNIQUE,
    full_name           VARCHAR(150) NOT NULL,
    designation         VARCHAR(100),
    department          VARCHAR(100),
    phone               VARCHAR(20),
    address             VARCHAR(255),
    date_of_birth       DATE,
    date_of_joining     DATE,
    profile_photo_url   VARCHAR(255),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. SALARY STRUCTURE — breakup per employee
-- ============================================================
CREATE TABLE salary_structures (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    employee_id         INT NOT NULL,
    basic               DECIMAL(12,2) NOT NULL DEFAULT 0,
    hra                 DECIMAL(12,2) NOT NULL DEFAULT 0,
    conveyance          DECIMAL(12,2) NOT NULL DEFAULT 0,
    medical_allowance   DECIMAL(12,2) NOT NULL DEFAULT 0,
    special_allowance   DECIMAL(12,2) NOT NULL DEFAULT 0,
    pf_deduction        DECIMAL(12,2) NOT NULL DEFAULT 0,
    professional_tax    DECIMAL(12,2) NOT NULL DEFAULT 0,
    other_deductions    DECIMAL(12,2) NOT NULL DEFAULT 0,
    gross_salary        DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_salary          DECIMAL(12,2) NOT NULL DEFAULT 0,
    effective_from      DATE NOT NULL,
    created_by          INT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_salary_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. PAYSLIPS — monthly generated salary receipts
-- ============================================================
CREATE TABLE payslips (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    month           TINYINT NOT NULL,
    year            SMALLINT NOT NULL,
    file_path       VARCHAR(255) NOT NULL,
    net_pay         DECIMAL(12,2) NOT NULL,
    generated_by    INT,
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payslip_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_payslip_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_employee_month_year (employee_id, month, year)
) ENGINE=InnoDB;

-- ============================================================
-- 5. LEAVE REQUESTS
-- ============================================================
CREATE TABLE leave_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    leave_type      ENUM('casual', 'sick', 'earned', 'unpaid') NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason          VARCHAR(255),
    status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by     INT,
    applied_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 6. LEAVE BALANCE — yearly quota tracking per employee
-- ============================================================
CREATE TABLE leave_balances (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    leave_type      ENUM('casual', 'sick', 'earned', 'unpaid') NOT NULL,
    year            SMALLINT NOT NULL,
    total_days      DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_days       DECIMAL(5,1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_leavebal_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uq_employee_leavetype_year (employee_id, leave_type, year)
) ENGINE=InnoDB;

-- ============================================================
-- 7. EMPLOYEE TAB ACCESS — per-employee, per-tab permission control
-- ============================================================
CREATE TABLE employee_tab_access (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    tab_name        ENUM('salary', 'payslips', 'leaves', 'profile') NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by      INT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tabaccess_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_tabaccess_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_employee_tab (employee_id, tab_name)
) ENGINE=InnoDB;

-- ============================================================
-- 8. HOLIDAYS — company-wide calendar
-- ============================================================
CREATE TABLE holidays (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    holiday_date    DATE NOT NULL,
    description     VARCHAR(255),
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_holiday_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. INVITE TOKENS — signup link issued when HR grants access
-- ============================================================
CREATE TABLE invite_tokens (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invite_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Indexes for common lookups
-- ============================================================
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payslips_employee_year ON payslips(employee_id, year);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);

-- ============================================================
-- Seed: default HR admin account (password should be hashed by app, this is placeholder)
-- ============================================================
INSERT INTO users (name, email, password, role, account_status)
VALUES ('HR Admin', 'admin@company.com', '$2b$10$replaceWithRealBcryptHash', 'hr', 'active');
