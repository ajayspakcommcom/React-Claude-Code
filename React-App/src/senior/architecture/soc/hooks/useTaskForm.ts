// SEPARATION OF CONCERNS — hooks/useTaskForm.ts
// LAYER 3 — Business Logic Layer
//
// Single responsibility: manages form state and validation.
// The component (TaskForm) is completely unaware of validation rules —
// it just calls setField/handleSubmit and shows whatever errors come back.

import { useState, useCallback } from "react";
import { EMPTY_FORM } from "../types";
import type { TaskFormData } from "../types";
import React from "react";

type FormErrors = Partial<Record<keyof TaskFormData, string>>;

export const useTaskForm = (onSubmit: (data: TaskFormData) => void) => {
  const [form,   setForm]   = useState<TaskFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const setField = useCallback(<K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setForm((f)   => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validation lives here — not in the component, not in the service
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title   = "Title is required";
    if (!form.dueDate)       newErrors.dueDate = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(form);
    setForm(EMPTY_FORM);
    setErrors({});
  }, [form, onSubmit]);

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
  }, []);

  return { form, errors, setField, handleSubmit, reset };
};
