// helpers/dmRoles.js
export const dmRoles = async (roles, client) => {
  const failed = [];

  for (const [userId, role] of roles.entries()) {
    try {
      const user = await client.users.fetch(userId);

      await user.send(
        `🎭 **Your Role: ${role}**\n\n` +
        "Do not reveal your role to other players.\n" +
        "Good luck… 😈"
      );
    } catch (err) {
      console.error(`Failed to DM user ${userId}`, err.message);
      failed.push({ userId, role });
    }
  }

  return failed;
};
