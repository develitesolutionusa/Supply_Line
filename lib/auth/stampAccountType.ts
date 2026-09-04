import { clerkClient } from "@clerk/nextjs/server";

export async function stampBusinessAccountType(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.unsafeMetadata?.accountType === "business") {
    return;
  }

  await client.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      ...user.unsafeMetadata,
      accountType: "business",
    },
  });
}