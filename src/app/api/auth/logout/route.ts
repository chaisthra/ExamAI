export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  return response;
}

export async function GET() {
  const response = Response.redirect('http://localhost:3000/login');
  response.headers.set(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  return response;
}
