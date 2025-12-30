/**
 * Module Selector Component
 * Reusable component for selecting a module
 */

import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { moduleAPI } from '../utils/api';

function ModuleSelector({ selectedModuleId, onModuleChange, required = true }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await moduleAPI.getAll();
      setModules(response.data.modules || []);
      setError(null);
    } catch (err) {
      setError('Failed to load modules');
      console.error('Error loading modules:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted">Loading modules...</div>;
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        Select Module {required && <span className="text-danger">*</span>}
      </Form.Label>
      <Form.Select
        value={selectedModuleId || ''}
        onChange={(e) => onModuleChange(e.target.value)}
        required={required}
      >
        <option value="">-- Select a module --</option>
        {modules.map((module) => (
          <option key={module._id} value={module._id}>
            {module.moduleCode} - {module.moduleName}
          </option>
        ))}
      </Form.Select>
      {modules.length === 0 && (
        <Form.Text className="text-muted">
          No modules found. Please create a module first.
        </Form.Text>
      )}
    </Form.Group>
  );
}

export default ModuleSelector;

