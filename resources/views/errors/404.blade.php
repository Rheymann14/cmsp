<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Page Not Found | {{ config('app.name', 'CHED') }}</title>
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 2rem 1.25rem;
                background:
                    radial-gradient(circle at 10% 10%, #e8f1ff 0%, transparent 45%),
                    radial-gradient(circle at 90% 90%, #fdf2e9 0%, transparent 40%),
                    #f8fbff;
                color: #1e293b;
                font-family: "Instrument Sans", "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                line-height: 1.5;
            }

            main {
                max-width: 620px;
                text-align: center;
            }

            .logo {
                width: 94px;
                height: 94px;
                object-fit: contain;
                margin-bottom: 0.75rem;
            }

            .code {
                margin: 0;
                font-size: clamp(3rem, 8vw, 5rem);
                line-height: 1;
                letter-spacing: -0.04em;
                color: #0f172a;
            }

            h1 {
                margin: 0.5rem 0 0;
                font-size: clamp(1.35rem, 3.4vw, 1.9rem);
                font-weight: 700;
                color: #0f172a;
            }

            p {
                margin: 0.9rem auto 1.5rem;
                font-size: clamp(1rem, 2.5vw, 1.08rem);
                color: #475569;
                max-width: 48ch;
            }

            a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                background: #2563eb;
                color: #ffffff;
                border-radius: 999px;
                padding: 0.7rem 1.2rem;
                font-weight: 600;
                transition: background-color 0.2s ease, transform 0.2s ease;
            }

            a:hover {
                background: #1d4ed8;
                transform: translateY(-1px);
            }

            a:focus-visible {
                outline: 3px solid #93c5fd;
                outline-offset: 2px;
            }
        </style>
    </head>
    <body>
        <main>
            <img class="logo" src="{{ asset('ched_logo.png') }}" alt="CHED logo">
            <p class="code">404</p>
            <h1>We can’t find that page.</h1>
            <p>The link might be broken, or the page may have been moved. Let’s get you back to somewhere familiar.</p>
            <a href="{{ url('/') }}">Go to Home</a>
        </main>
    </body>
</html>
