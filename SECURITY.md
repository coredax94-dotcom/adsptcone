# Security and production checklist

This MVP now sends baseline browser security headers and applies process-local limits to registration and login attempts.

Before public launch:

- Replace the process-local limiter with Redis or another shared store when using more than one server instance.
- Put the application behind HTTPS and a trusted reverse proxy; configure `x-forwarded-for` only at that proxy.
- Add email verification, password reset, MFA, and account recovery.
- Add a real CAPTCHA/challenge after repeated failures and a fraud review workflow.
- Store payment evidence in private object storage rather than accepting arbitrary public URLs.
- Add CSRF/origin validation if browser mutations are expanded beyond same-site cookie protections.
- Configure PostgreSQL backups, restore drills, monitoring, error tracking, log retention, and alerting.
- Review privacy, terms, advertising rules, payout regulations, and prohibited-content policy.
- Run `npm run db:generate`, `npm run db:migrate`, `npm run build`, and an end-to-end test suite in the deployment environment.
