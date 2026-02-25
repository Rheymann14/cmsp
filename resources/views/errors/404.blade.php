<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Page Not Found | {{ config('app.name', 'CHED') }}</title>
        <style>
            :root {
                color-scheme: light dark;
            }

            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #f4f7fb;
                font-family: "Instrument Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                color: #0f172a;
            }

            .container {
                width: min(92vw, 560px);
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 2rem;
                text-align: center;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }

            .logo {
                width: 88px;
                height: 88px;
                object-fit: contain;
                margin-bottom: 1rem;
            }

            h1 {
                margin: 0;
                font-size: 3rem;
                line-height: 1;
                letter-spacing: -0.04em;
            }

            h2 {
                margin: 0.75rem 0 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            p {
                margin: 0.9rem 0 1.4rem;
                color: #475569;
            }

            a {
                display: inline-block;
                text-decoration: none;
                background: #0f172a;
                color: #fff;
                padding: 0.7rem 1.1rem;
                border-radius: 10px;
                font-weight: 600;
            }

            a:hover {
                background: #1e293b;
            }

            @media (prefers-color-scheme: dark) {
                body {
                    background: #020617;
                    color: #e2e8f0;
                }

                .container {
                    background: #0f172a;
                    border-color: #1e293b;
                    box-shadow: none;
                }

                p {
                    color: #94a3b8;
                }

                a {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                a:hover {
                    background: #cbd5e1;
                }
            }
        </style>
    </head>
    <body>
        <main class="container">
            <img class="logo" src="{{ asset('ched_logo.png') }}" alt="CHED logo">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for may have been moved, deleted, or never existed.</p>
            <a href="{{ url('/') }}">Back to Home</a>
        </main>
    </body>
</html>
