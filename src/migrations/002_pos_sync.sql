CREATE TABLE IF NOT EXISTS pos_documents (
  id SERIAL PRIMARY KEY,
  doc_type VARCHAR(50) NOT NULL,
  doc_key VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (doc_type, doc_key)
);

CREATE INDEX IF NOT EXISTS idx_pos_documents_type ON pos_documents(doc_type);
