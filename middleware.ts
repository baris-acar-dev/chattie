import { withAuth } from 'next-auth/middleware'

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  // Protect specific routes
  matcher: [
    // Protect all routes except public ones
    '/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico).*)',
  ],
}
