import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Zap, BarChart3, Mic, Upload, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <header className="container mx-auto px-6 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-10 w-10 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-bold">TruthCast</span>
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-400">AI-Powered</Badge>
            </div>
          </div>
          <div className="space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Dashboard
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started Free</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-5xl mx-auto">
          <div className="flex justify-center mb-6">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400 px-4 py-2">
              🚀 Now with Real-Time Fact-Checking
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent">
            AI-Powered Podcast
            <br />
            <span className="text-emerald-400">Fact-Checking</span> Platform
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your podcasts and get instant, AI-powered fact-checking with multi-source verification. Build trust
            with your audience through transparent, accurate content validation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-4 text-lg">
                <Upload className="w-5 h-5 mr-2" />
                Start Fact-Checking
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Live Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">10,000+</div>
              <div className="text-slate-400">Podcasts Verified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">95%</div>
              <div className="text-slate-400">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">2.5s</div>
              <div className="text-slate-400">Avg Response Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Lightning Fast Processing</CardTitle>
              <CardDescription className="text-slate-400">
                Get comprehensive fact-check results in under 3 seconds. Our advanced AI processes content instantly
                with multi-source verification.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Multi-Source Verification</CardTitle>
              <CardDescription className="text-slate-400">
                Every claim is verified against 3+ credible sources including Reuters, AP News, and academic databases
                for maximum accuracy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Detailed Analytics</CardTitle>
              <CardDescription className="text-slate-400">
                Comprehensive reports with confidence scores, source citations, trend analysis, and exportable
                fact-check summaries.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-orange-400" />
              </div>
              <CardTitle className="text-white">Live Recording Support</CardTitle>
              <CardDescription className="text-slate-400">
                Real-time fact-checking during live recordings with instant alerts and private audio feedback through
                earbuds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-400" />
              </div>
              <CardTitle className="text-white">Team Collaboration</CardTitle>
              <CardDescription className="text-slate-400">
                Share fact-check results with your team, add custom notes, and maintain a centralized knowledge base for
                your podcast network.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle className="text-white">Enterprise Security</CardTitle>
              <CardDescription className="text-slate-400">
                SOC 2 compliant with end-to-end encryption, audit logs, and enterprise-grade security for sensitive
                content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-8 mb-20 border border-slate-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">See TruthCast in Action</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Watch how TruthCast analyzes podcast content and provides instant fact-checking with source verification.
            </p>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300">Live Analysis</Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-slate-400">Claim Detected</span>
                  <Badge className="bg-blue-500/20 text-blue-300">Analyzing...</Badge>
                </div>
                <p className="text-white">
                  Global temperatures have risen by 1.1 degrees Celsius since pre-industrial times.
                </p>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-slate-400">Fact-Check Result</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300">✓ Verified</Badge>
                </div>
                <p className="text-white mb-3">
                  This claim is <strong className="text-emerald-400">TRUE</strong> with 94% confidence.
                </p>
                <div className="text-sm text-slate-400">
                  <strong>Sources:</strong> IPCC Report 2023, NASA Climate Data, NOAA Temperature Records
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border-emerald-500/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white mb-4">Ready to Build Trust with Your Audience?</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Join thousands of podcasters who use TruthCast to ensure accuracy and build credibility. Start your free
                trial today - no credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-4">
                    Start Free Trial
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4"
                >
                  Schedule Demo
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-4">Free 14-day trial • No setup fees • Cancel anytime</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-emerald-400" />
                <span className="text-xl font-bold">TruthCast</span>
              </div>
              <p className="text-slate-400">
                AI-powered fact-checking for the modern podcaster. Build trust through transparency.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 TruthCast. All rights reserved. Built with AI for accuracy and trust.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
