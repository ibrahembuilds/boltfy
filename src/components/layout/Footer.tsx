import { Link } from "react-router-dom";
import { Mail, Heart } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export const Footer = () => {
    return (
        <footer className="bg-background border-t border-border pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-1 space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <BrandLogo size="md" />
                        </Link>
                        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                            Build beautiful forms and collect responses with ease.
                            Free forever, no credit card required.
                        </p>
                        <a
                            href="mailto:support@boltfy.io"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                            support@boltfy.io
                        </a>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground">Product</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground">Company</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="mailto:support@boltfy.io"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                        © {new Date().getFullYear()} Boltfy. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by Boltfy Team
                    </div>
                </div>
            </div>
        </footer>
    );
};
