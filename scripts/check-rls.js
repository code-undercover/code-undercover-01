const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

async function main() {
    const rows = await db.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
        AND rowsecurity = false`

    if (rows.length) {
        console.error("RLS disabled:", rows.map(r => r.tablename).join(", "))
        process.exit(1)
    }
    console.log("RLS ok")
}

main()
    .catch(async (error) => {
        // Unreachable is not the same as insecure. Naming the cause is what
        // turns an opaque exit code into something actionable in the build log.
        console.error("RLS check could not run:", error?.message ?? error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })