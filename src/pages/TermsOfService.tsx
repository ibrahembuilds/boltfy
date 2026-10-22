import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/layout/SEO";
import { Footer } from "@/components/layout/Footer";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Terms of Service"
                description="Legal terms for using Boltfy — free form builder, subscriber management, and email campaigns."
                path="/terms"
            />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8 text-lg">Last updated: December 28, 2025</p>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Agreement to Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using Boltfy, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Use of License</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Permission is granted to temporarily download one copy of the materials (information or software) on Boltfy's website for personal, non-commercial transitory viewing only.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Disclaimer</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The materials on Boltfy's website are provided on an 'as is' basis. Boltfy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Limitations</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                In no event shall Boltfy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Boltfy's website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">5. Revisions and Errata</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                The materials appearing on Boltfy's website could include technical, typographical, or photographic errors. Boltfy does not warrant that any of the materials on its website are accurate, complete or current.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">6. Links</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Boltfy has not reviewed all of the websites linked to its internet website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Boltfy of the site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">7. Governing Law</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
