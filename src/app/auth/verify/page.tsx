import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-chess-bg px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <div className="text-4xl mb-4">&#9993;</div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Check Your Email
        </h1>
        <p className="text-gray-400 mb-6">
          A sign-in link has been sent to your email address. Click the link to
          complete sign in.
        </p>
        <Link
          href="/"
          className="text-chess-accent hover:text-chess-accent-hover transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
