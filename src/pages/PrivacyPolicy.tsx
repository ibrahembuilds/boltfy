import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail, Lock, Database, Eye, Users, Trash2, Download, Globe } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background">
            {/* Simple Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <BrandLogo size="sm" />
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Privacy Policy</h1>
                        <p className="text-muted-foreground text-lg">
                            Your privacy is important to us. This policy explains how Boltfy handles your data.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Last updated: December 30, 2024</p>
                    </div>

                    {/* Quick Overview */}
                    <div className="bg-muted/30 rounded-2xl border border-border p-6 mb-12">
                        <h2 className="text-lg font-bold text-foreground mb-4">Quick Overview</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Database className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground text-sm">What we collect</p>
                                    <p className="text-muted-foreground text-sm">Email, name, forms you create, and responses</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Lock className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground text-sm">How we protect it</p>
                                    <p className="text-muted-foreground text-sm">Industry-standard encryption and security</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground text-sm">Who we share with</p>
                                    <p className="text-muted-foreground text-sm">No one - we never sell your data</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Trash2 className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground text-sm">Your rights</p>
                                    <p className="text-muted-foreground text-sm">Access, export, or delete your data anytime</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Policy */}
                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
                                Introduction
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Welcome to Boltfy ("we," "our," or "us"). We are a form building platform that allows users to create forms,
                                collect responses, and analyze data. This Privacy Policy explains how we collect, use, disclose, and safeguard
                                your information when you use our website and services at <strong>boltfy.io</strong>.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                By using Boltfy, you agree to the collection and use of information in accordance with this policy.
                                If you do not agree with our policies and practices, please do not use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</span>
                                Information We Collect
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                We collect information that you provide directly to us when using our service:
                            </p>

                            <div className="space-y-4">
                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-foreground">Account Information</h3>
                                    </div>
                                    <ul className="list-disc pl-10 space-y-1 text-muted-foreground text-sm">
                                        <li>Email address (required for account creation)</li>
                                        <li>Name (optional, for personalization)</li>
                                        <li>Password (securely hashed, never stored in plain text)</li>
                                    </ul>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Database className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-foreground">Form Data</h3>
                                    </div>
                                    <ul className="list-disc pl-10 space-y-1 text-muted-foreground text-sm">
                                        <li>Forms you create (fields, settings, styling)</li>
                                        <li>Responses submitted to your forms</li>
                                        <li>Subscriber/contact information you collect</li>
                                    </ul>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Eye className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-foreground">Usage Information</h3>
                                    </div>
                                    <ul className="list-disc pl-10 space-y-1 text-muted-foreground text-sm">
                                        <li>How you interact with our service</li>
                                        <li>Features you use and pages you visit</li>
                                        <li>Device and browser information</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">3</span>
                                How We Use Your Information
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                We use the information we collect for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Provide our Service:</strong> Create and manage your account, store your forms, and process responses</li>
                                <li><strong>Send Notifications:</strong> Email you about new form responses, account updates, and important service announcements</li>
                                <li><strong>Improve our Platform:</strong> Understand how users interact with Boltfy to make it better</li>
                                <li><strong>Customer Support:</strong> Respond to your questions and help resolve issues</li>
                                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized access</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">4</span>
                                Google Sign-In
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                When you choose to sign in with Google, we receive the following information from Google:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Email address:</strong> Used to create and identify your Boltfy account</li>
                                <li><strong>Name:</strong> Used to personalize your experience</li>
                                <li><strong>Profile picture:</strong> Displayed in your account (optional)</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                We only request the minimum permissions necessary. We do not access your Google contacts, calendar,
                                or any other Google services beyond basic profile information for authentication.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">5</span>
                                Data Security
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We take the security of your data seriously and implement industry-standard measures to protect it:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                                <li>All data is encrypted in transit using TLS/SSL</li>
                                <li>Passwords are hashed using secure algorithms</li>
                                <li>Database access is restricted and monitored</li>
                                <li>Regular security audits and updates</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">6</span>
                                Data Sharing
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong>We do not sell, trade, or rent your personal information to third parties.</strong>
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-4">
                                We may share information only in the following limited circumstances:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                                <li><strong>Service Providers:</strong> We use trusted third-party services (hosting, email delivery) that process data on our behalf</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">7</span>
                                Your Rights
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                You have the following rights regarding your personal data:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <Eye className="h-5 w-5 text-primary mb-2" />
                                    <h3 className="font-semibold text-foreground text-sm">Right to Access</h3>
                                    <p className="text-muted-foreground text-sm">View all data we have about you</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <Download className="h-5 w-5 text-primary mb-2" />
                                    <h3 className="font-semibold text-foreground text-sm">Right to Export</h3>
                                    <p className="text-muted-foreground text-sm">Download your data in common formats</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <Trash2 className="h-5 w-5 text-primary mb-2" />
                                    <h3 className="font-semibold text-foreground text-sm">Right to Deletion</h3>
                                    <p className="text-muted-foreground text-sm">Request complete deletion of your data</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                    <Globe className="h-5 w-5 text-primary mb-2" />
                                    <h3 className="font-semibold text-foreground text-sm">Right to Portability</h3>
                                    <p className="text-muted-foreground text-sm">Transfer your data to another service</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">8</span>
                                Cookies
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use essential cookies to keep you logged in and remember your preferences.
                                We do not use tracking cookies or sell cookie data to advertisers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">9</span>
                                Contact Us
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                            </p>
                            <div className="bg-muted/30 rounded-lg p-6 border border-border mt-4">
                                <p className="text-foreground font-medium">Boltfy Support</p>
                                <p className="text-muted-foreground">Email: <a href="mailto:support@boltfy.io" className="text-primary hover:underline">support@boltfy.io</a></p>
                                <p className="text-muted-foreground">Website: <a href="https://boltfy.io" className="text-primary hover:underline">boltfy.io</a></p>
                            </div>
                        </section>
                    </div>

                    {/* Links to other policies */}
                    <div className="mt-12 pt-8 border-t border-border">
                        <p className="text-muted-foreground text-center">
                            Also see our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
