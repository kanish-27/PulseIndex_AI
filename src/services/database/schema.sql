-- SQL DDL Schema for MediGuard AI Document Storage
-- Defines the structure of the medical_documents table for relational database exports (e.g. Supabase, PostgreSQL)

CREATE TABLE IF NOT EXISTS medical_documents (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL, -- size in bytes
  hospital_name VARCHAR(255),
  doctor_name VARCHAR(255),
  upload_date VARCHAR(50) NOT NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  processing_mode VARCHAR(20) NOT NULL CHECK (processing_mode IN ('STRUCTURED', 'ORIGINAL')),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast search filtering
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_category ON medical_documents(category);
CREATE INDEX IF NOT EXISTS idx_medical_documents_mode ON medical_documents(processing_mode);
