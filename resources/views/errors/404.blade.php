<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Page Not Found | {{ config('app.name', 'CHED') }}</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=nunito:400,600,700,800" rel="stylesheet" />
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
                    radial-gradient(900px 460px at 0% 0%, #e8f1ff 0%, transparent 55%),
                    radial-gradient(760px 420px at 100% 100%, #fff0e5 0%, transparent 50%),
                    linear-gradient(180deg, #f9fbff 0%, #f6faff 100%);
                color: #1e293b;
                font-family: "Nunito", "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            }

            main {
                max-width: 640px;
                text-align: center;
                animation: fade-in 320ms ease-out;
            }

            .logo {
                width: 98px;
                height: 98px;
                object-fit: contain;
                margin-bottom: 0.8rem;
                filter: drop-shadow(0 8px 18px rgba(37, 99, 235, 0.18));
            }

            .code {
                margin: 0;
                font-size: clamp(3rem, 9vw, 5.4rem);
                line-height: 1;
                font-weight: 800;
                letter-spacing: -0.05em;
                color: #0f172a;
            }

            h1 {
                margin: 0.6rem 0 0;
                font-size: clamp(1.35rem, 3.4vw, 2rem);
                font-weight: 800;
                color: #0f172a;
            }

            p {
                margin: 0.95rem auto 1.65rem;
                max-width: 50ch;
                font-size: clamp(1rem, 2.6vw, 1.1rem);
                line-height: 1.65;
                color: #475569;
            }

            a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: #fff;
                border-radius: 999px;
                padding: 0.74rem 1.35rem;
                font-weight: 700;
                font-size: 0.98rem;
                box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
                transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
            }

            a:hover {
                transform: translateY(-1px);
                box-shadow: 0 12px 20px rgba(37, 99, 235, 0.25);
                filter: brightness(1.02);
            }

            a:focus-visible {
                outline: 3px solid #93c5fd;
                outline-offset: 3px;
            }

            @keyframes fade-in {
                from {
                    opacity: 0;
                    transform: translateY(6px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    </head>
    <body>
        <main>
            <img class="logo" src="{{ asset('ched_logo.png') }}" alt="CHED logo">
            <p class="code">404</p>
            <h1>We can’t find that page.</h1>
            <p>The link may be broken or the page might have moved. No worries—we’ll help you get back on track.</p>
            <a href="{{ url('/') }}">Go to Home</a>
        </main>
    </body>
</html>
