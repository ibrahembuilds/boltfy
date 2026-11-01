import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Send, Globe } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { SEO } from "@/components/layout/SEO";
import { emailService } from "@/lib/email";

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
}

interface FormStyle {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonText: string;
    buttonTextColor: string;
    borderRadius: number;
    fontFamily: string;
    titleAlignment: "left" | "center" | "right";
    labelAlignment: "left" | "center" | "right";
    padding: number;
    spacing: number;
    logoUrl: string;
    logoSize: number;
    showLogo: boolean;
    buttonStyle: "solid" | "outline" | "gradient";
    isSubscriberForm: boolean;
    backgroundStyle: "solid" | "gradient" | "pattern";
    gradientDirection: string;
    secondaryColor: string;
    borderColor: string;
    inputBackground: string;
}

interface CustomForm {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    fields: Json;
    settings: Json;
}

const defaultStyle: FormStyle = {
    primaryColor: "#6366f1",
    backgroundColor: "#ffffff",
    textColor: "#1e293b",
    buttonText: "Submit",
    buttonTextColor: "#ffffff",
    borderRadius: 12,
    fontFamily: "Inter",
    titleAlignment: "center",
    labelAlignment: "left",
    padding: 32,
    spacing: 20,
    logoUrl: "",
    logoSize: 60,
    showLogo: false,
    buttonStyle: "solid",
    isSubscriberForm: false,
    backgroundStyle: "solid",
    gradientDirection: "to bottom right",
    secondaryColor: "#8b5cf6",
    borderColor: "#e2e8f0",
    inputBackground: "#f8fafc",
};

export default function PublicForm() {
    const { slug } = useParams();
    const location = useLocation();
    const { toast } = useToast();
    const [form, setForm] = useState<CustomForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, string | boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [honeypot, setHoneypot] = useState("");
    const [isEmbed, setIsEmbed] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("embed") === "true";
    });
    const formRef = useRef<HTMLDivElement>(null);
    // Timestamp the form actually became visible, so a submission that
    // arrives implausibly fast can be treated as automated.
    const shownAtRef = useRef<number | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setIsEmbed(params.get("embed") === "true");
    }, [location]);

    useEffect(() => {
        if (!isEmbed) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = entry.contentRect.height + 40; // Add some buffer
                window.parent.postMessage({ type: "resize", height }, "*");
            }
        });

        if (formRef.current) {
            observer.observe(formRef.current);
        }

        return () => observer.disconnect();
    }, [isEmbed, loading, submitted]);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);

            // get_public_form exposes only what is needed to render and fill the
            // form: no owner id, no notification address. It resolves a slug
            // (or, for older links, a form id).
            const { data, error } = await supabase.rpc("get_public_form", { p_slug: slug });
            if (cancelled) return;

            if (error) {
                console.error("Error fetching form:", error);
            }

            const found = Array.isArray(data) ? data[0] : null;
            if (!found) {
                setForm(null);
            } else {
                setForm(found);
                const fields = Array.isArray(found.fields) ? found.fields as unknown as FormField[] : [];
                const initialData: Record<string, string | boolean> = {};
                fields.forEach((field) => {
                    initialData[field.id] = field.type === "checkbox" ? false : "";
                });
                setFormData(initialData);
                shownAtRef.current = Date.now();
            }

            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    const validateForm = () => {
        const fields = Array.isArray(form?.fields) ? form.fields as unknown as FormField[] : [];
        const newErrors: Record<string, string> = {};

        fields.forEach((field) => {
            if (field.required) {
                const value = formData[field.id];
                if (field.type === "checkbox") {
                    if (!value) {
                        newErrors[field.id] = "This field is required";
                    }
                } else if (!value || (typeof value === "string" && !value.trim())) {
                    newErrors[field.id] = "This field is required";
                }
            }

            if (field.type === "email" && formData[field.id]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(String(formData[field.id]))) {
                    newErrors[field.id] = "Please enter a valid email";
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form) return;

        // Bot heuristics: a filled honeypot or an implausibly fast submit
        // (a human can't read the form and type into it in under a second)
        // are treated as spam. Pretend to succeed so bots don't learn why
        // they were blocked.
        const submittedTooFast = shownAtRef.current !== null && Date.now() - shownAtRef.current < 1500;
        if (honeypot || submittedTooFast) {
            setSubmitted(true);
            return;
        }

        if (!validateForm()) {
            toast({
                title: "Please fix the errors",
                description: "Some required fields are missing",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);

        try {
            const style = getFormStyle();
            const fields = Array.isArray(form.fields) ? form.fields as unknown as FormField[] : [];

            // A display name for newsletter signups (the address itself is taken
            // from the form's email field on the server, and whether this form
            // adds subscribers at all is decided by the form's own settings).
            let name = "";
            if (style.isSubscriberForm) {
                fields.forEach((field) => {
                    const value = String(formData[field.id] || "");
                    if ((field.label.toLowerCase().includes("name") || field.type === "text") && value && !name) {
                        name = value;
                    }
                });
            }

            const { data: submissionId, error: submissionError } = await supabase.rpc("submit_public_form", {
                p_form_id: form.id,
                p_metadata: formData as unknown as Json,
                p_subscriber_name: name || null,
            });

            if (submissionError) throw submissionError;

            // Tell the form owner. The server reads the stored submission and
            // sends at most one email per submission; failures must never cost
            // the visitor their successful submission, so this is not awaited.
            if (typeof submissionId === "string") {
                emailService.sendFormNotification(submissionId).catch((emailError) => {
                    console.error("Failed to send email notification:", emailError);
                });
            }

            setSubmitted(true);
            toast({
                title: "Thank you! 🎉",
                description: style.isSubscriberForm
                    ? "You've been added to our list!"
                    : "Your response has been submitted.",
            });
        } catch (error) {
            toast({
                title: "Something went wrong",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (fieldId: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    const getFormStyle = (): FormStyle => {
        const settings = form?.settings as { style?: Partial<FormStyle> } | null;
        return { ...defaultStyle, ...settings?.style };
    };

    const getBackgroundStyle = (style: FormStyle) => {
        switch (style.backgroundStyle) {
            case "gradient":
                return {
                    background: `linear-gradient(${style.gradientDirection}, ${style.primaryColor}, ${style.secondaryColor})`,
                };
            case "pattern":
                return {
                    background: style.backgroundColor,
                    backgroundImage: `radial-gradient(${style.primaryColor}15 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                };
            default:
                return { backgroundColor: style.backgroundColor };
        }
    };

    const getButtonStyle = (style: FormStyle) => {
        switch (style.buttonStyle) {
            case "outline":
                return {
                    backgroundColor: "transparent",
                    color: style.primaryColor,
                    border: `2px solid ${style.primaryColor}`,
                    borderRadius: `${style.borderRadius}px`,
                };
            case "gradient":
                return {
                    background: `linear-gradient(135deg, ${style.primaryColor}, ${style.secondaryColor})`,
                    color: style.buttonTextColor,
                    border: "none",
                    borderRadius: `${style.borderRadius}px`,
                };
            default:
                return {
                    backgroundColor: style.primaryColor,
                    color: style.buttonTextColor,
                    border: "none",
                    borderRadius: `${style.borderRadius}px`,
                };
        }
    };

    // Prefixed so a field called "website" can never clash with another element's id.
    const inputIdFor = (fieldId: string) => `f_${fieldId}`;

    const renderField = (field: FormField, style: FormStyle) => {
        const hasError = !!errors[field.id];
        const inputId = inputIdFor(field.id);

        const inputStyle = {
            borderRadius: `${style.borderRadius}px`,
            backgroundColor: style.inputBackground || "#f8fafc",
            borderColor: hasError ? "#ef4444" : (style.borderColor || "#e2e8f0"),
            color: style.textColor,
        };

        switch (field.type) {
            case "textarea":
                return (
                    <Textarea
                        id={inputId}
                        aria-invalid={hasError}
                        placeholder={field.placeholder}
                        value={String(formData[field.id] || "")}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        style={inputStyle}
                        rows={4}
                        className={hasError ? "ring-2 ring-red-200" : ""}
                    />
                );
            case "select":
                return (
                    <Select
                        value={String(formData[field.id] || "")}
                        onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                        <SelectTrigger id={inputId} aria-invalid={hasError} style={inputStyle} className={hasError ? "ring-2 ring-red-200" : ""}>
                            <SelectValue placeholder="Select an option..." />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "checkbox":
                return (
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id={inputId}
                            aria-invalid={hasError}
                            checked={Boolean(formData[field.id])}
                            onCheckedChange={(checked) => handleInputChange(field.id, Boolean(checked))}
                            style={{ borderColor: style.primaryColor }}
                        />
                        <label
                            htmlFor={inputId}
                            className="text-sm leading-none cursor-pointer"
                            style={{ color: style.textColor }}
                        >
                            {field.label}
                        </label>
                    </div>
                );
            default:
                return (
                    <Input
                        id={inputId}
                        aria-invalid={hasError}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={String(formData[field.id] || "")}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        style={inputStyle}
                        className={`h-12 ${hasError ? "ring-2 ring-red-200" : ""}`}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isEmbed ? "bg-transparent" : "bg-background"}`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-xl animate-pulse">
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                        <img src="/icon.png" alt="Boltfy" className="w-10 h-10 object-contain" />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Loading Form</p>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isEmbed ? "bg-transparent" : "bg-background"}`}>
                <Card className={`max-w-md w-full text-center border-border bg-card ${isEmbed ? "shadow-none border-none" : "shadow-2xl"}`}>
                    <CardContent className="pt-12 pb-12 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                            <div className="text-4xl">🔍</div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Form Not Found</h1>
                        <p className="text-muted-foreground mb-8 text-sm max-w-[280px]">
                            This form doesn't exist or may have been removed by its creator.
                        </p>
                        {!isEmbed && (
                            <Link to="/">
                                <Button variant="outline" className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Create Your Own Form
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const fields = Array.isArray(form.fields) ? form.fields as unknown as FormField[] : [];
    const style = getFormStyle();

    if (submitted) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${isEmbed ? "p-0 bg-transparent" : "p-4 bg-[#f8fafc]"}`}
            >
                <div
                    className={`${isEmbed ? "w-full" : "max-w-md w-full"} text-center shadow-2xl`}
                    ref={formRef}
                    style={{
                        ...getBackgroundStyle(style),
                        borderRadius: isEmbed ? 0 : `${style.borderRadius}px`,
                        padding: `${style.padding * 1.5}px`,
                        fontFamily: style.fontFamily,
                        boxShadow: isEmbed ? "none" : undefined,
                        border: isEmbed ? "none" : undefined,
                    }}
                >
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${style.primaryColor}20` }}
                    >
                        <CheckCircle className="h-10 w-10" style={{ color: style.primaryColor }} />
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: style.textColor }}
                    >
                        Thank You! 🎉
                    </h1>
                    <p
                        className="mb-6 opacity-75"
                        style={{ color: style.textColor }}
                    >
                        {style.isSubscriberForm
                            ? "You've been added to our newsletter!"
                            : "Your response has been submitted successfully."}
                    </p>
                    <Button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({});
                            const initialData: Record<string, string | boolean> = {};
                            fields.forEach((field) => {
                                initialData[field.id] = field.type === "checkbox" ? false : "";
                            });
                            setFormData(initialData);
                        }}
                        style={getButtonStyle(style)}
                        className="h-12 px-8"
                    >
                        Submit Another Response
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen flex items-center justify-center ${isEmbed ? "p-0 bg-transparent" : "py-12 px-4 bg-[#f8fafc]"}`}
        >
            <div className={`${isEmbed ? "w-full" : "max-w-lg w-full"}`} ref={formRef}>
                <div
                    className="shadow-2xl"
                    style={{
                        ...getBackgroundStyle(style),
                        borderRadius: isEmbed ? 0 : `${style.borderRadius}px`,
                        padding: `${style.padding}px`,
                        fontFamily: style.fontFamily,
                        boxShadow: isEmbed ? "none" : undefined,
                        border: isEmbed ? "none" : undefined,
                    }}
                >
                    <SEO
                        title={form.name}
                        description={form.description || `Submit your response to ${form.name} - Created with Boltfy.`}
                    />
                    {/* Logo */}
                    {style.showLogo && style.logoUrl && (
                        <div
                            className="mb-6"
                            style={{ textAlign: style.titleAlignment }}
                        >
                            <img
                                src={style.logoUrl}
                                alt="Logo"
                                style={{
                                    height: style.logoSize,
                                    display: "inline-block",
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        </div>
                    )}

                    {/* Title & Description */}
                    <div
                        className="mb-8"
                        style={{ textAlign: style.titleAlignment }}
                    >
                        <h1
                            className="text-2xl font-bold mb-2"
                            style={{ color: style.textColor }}
                        >
                            {form.name}
                        </h1>
                        {form.description && (
                            <p
                                className="opacity-75"
                                style={{ color: style.textColor }}
                            >
                                {form.description}
                            </p>
                        )}
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col"
                        style={{ gap: `${style.spacing}px` }}
                    >
                        {/* Honeypot: hidden from sighted users and screen readers,
                            but visible to simple bots that auto-fill every field. */}
                        <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                            <label htmlFor="hp_website">Website</label>
                            <input
                                type="text"
                                id="hp_website"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                            />
                        </div>

                        {fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                {field.type !== "checkbox" && (
                                    <Label
                                        htmlFor={inputIdFor(field.id)}
                                        className="font-medium text-sm"
                                        style={{
                                            color: style.textColor,
                                            display: "block",
                                            textAlign: style.labelAlignment,
                                        }}
                                    >
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                )}
                                {renderField(field, style)}
                                {errors[field.id] && (
                                    <p className="text-xs text-red-500">{errors[field.id]}</p>
                                )}
                            </div>
                        ))}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={getButtonStyle(style)}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    {style.buttonText}
                                    <Send className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>

                        {style.isSubscriberForm && (
                            <p
                                className="text-xs text-center mt-2 opacity-60"
                                style={{ color: style.textColor }}
                            >
                                📧 Your email will be added to our newsletter
                            </p>
                        )}
                    </form>
                </div>

                {/* Footer */}
                {!isEmbed && (
                    <div className="text-center mt-10">
                        <Link to="/" className="inline-flex items-center gap-2 group opacity-60 hover:opacity-100 transition-all">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-sm group-hover:scale-110 transition-transform">
                                <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center overflow-hidden">
                                    <img src="/icon.png" alt="Boltfy" className="w-4 h-4 object-contain" />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors tracking-tight">
                                Powered by <span className="font-bold text-slate-700 dark:text-slate-200">Boltfy</span>
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
