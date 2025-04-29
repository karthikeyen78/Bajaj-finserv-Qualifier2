import { useState } from "react";

interface User {
  rollNumber: string;
  name: string;
}

interface FormField {
  fieldId: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "date"
    | "dropdown"
    | "radio"
    | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: {
    message: string;
  };
  options?: Array<{
    value: string;
    label: string;
    dataTestId?: string;
  }>;
  maxLength?: number;
  minLength?: number;
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormData {
  formTitle: string;
  formId: string;
  version: string;
  sections: FormSection[];
}

interface FormResponse {
  message: string;
  form: FormData;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>({ rollNumber: "", name: "" });
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#F8F6F4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#C4DFDF",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    marginTop: "0.25rem",
    marginBottom: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: "bold",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const response = await fetch(
        "https://dynamic-form-generator-9rl7.onrender.com/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rollNumber: user.rollNumber,
            name: user.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      setIsLoggedIn(true);
      fetchForm();
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber=${user.rollNumber}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch form data");
      }

      const data: FormResponse = await response.json();
      setFormData(data.form);

      const initialValues: Record<string, any> = {};
      data.form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialValues[field.fieldId] = false;
          } else {
            initialValues[field.fieldId] = "";
          }
        });
      });

      setFormValues(initialValues);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    if (errors[fieldId]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  const validateField = (field: FormField, value: any): string => {
    if (
      field.required &&
      (value === "" || value === undefined || value === null)
    ) {
      return field.validation?.message || "This field is required";
    }

    if (typeof value === "string") {
      if (field.minLength && value.length < field.minLength) {
        return `Minimum ${field.minLength} characters required`;
      }

      if (field.maxLength && value.length > field.maxLength) {
        return `Maximum ${field.maxLength} characters allowed`;
      }
    }

    if (field.type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      return "Please enter a valid email address";
    }

    if (field.type === "tel" && value && !/^\d{10}$/.test(value)) {
      return "Please enter a valid 10-digit phone number";
    }

    return "";
  };

  const validateSection = (sectionIndex: number): boolean => {
    if (!formData) return false;

    const currentSectionData = formData.sections[sectionIndex];
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentSectionData.fields.forEach((field) => {
      const errorMessage = validateField(field, formValues[field.fieldId]);
      if (errorMessage) {
        newErrors[field.fieldId] = errorMessage;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    const isValid = validateSection(currentSection);

    if (isValid && formData) {
      if (currentSection < formData.sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateSection(currentSection);

    if (isValid) {
      console.log("Form Data Submitted:", formValues);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "date":
        return (
          <input
            type={field.type}
            id={field.fieldId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            style={inputStyle}
          />
        );
      case "textarea":
        return (
          <textarea
            id={field.fieldId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            style={inputStyle}
          />
        );
      case "dropdown":
        return (
          <select
            id={field.fieldId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            style={inputStyle}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div>
            {field.options?.map((option) => (
              <label key={option.value} style={{ marginRight: "1rem" }}>
                <input
                  type="radio"
                  name={field.fieldId}
                  value={option.value}
                  checked={formValues[field.fieldId] === option.value}
                  onChange={() =>
                    handleInputChange(field.fieldId, option.value)
                  }
                  style={{ marginRight: "4px" }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label>
            <input
              type="checkbox"
              id={field.fieldId}
              checked={formValues[field.fieldId] || false}
              onChange={(e) =>
                handleInputChange(field.fieldId, e.target.checked)
              }
              style={{ marginRight: "4px" }}
            />
            {field.label}
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {!isLoggedIn ? (
          <>
            <h2 style={{ textAlign: "center" }}>Student Login</h2>
            {loginError && (
              <div style={{ color: "red", marginBottom: "1rem" }}>
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <label style={labelStyle} htmlFor="rollNumber">
                Roll Number
              </label>
              <input
                type="text"
                id="rollNumber"
                value={user.rollNumber}
                onChange={(e) =>
                  setUser({ ...user, rollNumber: e.target.value })
                }
                required
                style={inputStyle}
              />
              <label style={labelStyle} htmlFor="name">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                required
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#007bff",
                  color: "white",
                  width: "100%",
                  marginTop: "1rem",
                }}
              >
                {isLoading ? "Loading..." : "Login"}
              </button>
            </form>
          </>
        ) : isLoading ? (
          <p>Loading form...</p>
        ) : formData ? (
          <>
            <h2>{formData.formTitle}</h2>
            <form onSubmit={handleSubmit}>
              <h3>{formData.sections[currentSection].title}</h3>
              <p>{formData.sections[currentSection].description}</p>

              {formData.sections[currentSection].fields.map((field) => (
                <div key={field.fieldId}>
                  <label style={labelStyle}>
                    {field.label}{" "}
                    {field.required && <span style={{ color: "red" }}>*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.fieldId] && (
                    <div style={{ color: "red", marginBottom: "0.5rem" }}>
                      {errors[field.fieldId]}
                    </div>
                  )}
                </div>
              ))}

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentSection === 0}
                  style={{
                    ...buttonStyle,
                    backgroundColor: currentSection === 0 ? "#ccc" : "#6c757d",
                    color: "white",
                  }}
                >
                  Previous
                </button>
                {currentSection < formData.sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      ...buttonStyle,
                      backgroundColor: "#007bff",
                      color: "white",
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    style={{
                      ...buttonStyle,
                      backgroundColor: "green",
                      color: "white",
                    }}
                  >
                    Submit
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div>
            <p style={{ color: "red" }}>
              Failed to load form. Please try again.
            </p>
            <button
              onClick={() => setIsLoggedIn(false)}
              style={{
                ...buttonStyle,
                marginTop: "1rem",
                backgroundColor: "#007bff",
                color: "white",
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
