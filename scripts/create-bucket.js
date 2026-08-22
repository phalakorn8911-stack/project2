const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data, error } = await supabase.storage.createBucket("vehicle-photos", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  })
  if (error) {
    if (error.message.includes("already exists")) {
      console.log("Bucket 'vehicle-photos' already exists")
    } else {
      console.error("Error:", error.message)
      process.exit(1)
    }
  } else {
    console.log("Bucket created:", data)
  }
}

main()
