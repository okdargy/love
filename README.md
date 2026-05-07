<div align="center">
  <img src="https://raw.githubusercontent.com/okdargy/love/refs/heads/main/public/favicon.svg" alt="favicon" width="100" height="100"><br />

  # LOVE

  <p>A Next.js website for trading & economy information for Polytoria</p>
</div>

## Stack

- [Next.js](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [LibSQL](https://turso.tech/libsql)

<br>
<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/fcfabb83-4e9a-4d7b-ac37-86c27bfe1197" alt="Website Preview" style="border-radius: 8px; max-width: 100%; height: auto;">
      </td>
    </tr>
    <tr>
      <td align="center">
        <em>Website Preview</em>
      </td>
    </tr>
  </table>
</div>

## Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Then, install the necessary dependencies with the package manager of your choosing:

```bash
bun install
```

You need to then push the SQL schema to your database:

```bash
bun run db:push
```

Finally, either build for production or start a dev server:

```bash
# Production
bun run build
bun run start

# Development
bun run dev
```

Then, if you want to start importing data, run the injestor: 
```
bun run injestor
```
-# (yes, I know it's spelled ingestor, the joke is jestor.. jester.. nvm)
