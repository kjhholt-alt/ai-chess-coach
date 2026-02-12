import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            A sign-in link has been sent to your email address. Click the
            link in the email to complete sign in.
          </p>
          <Link href="/" className="mt-6 inline-block">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
