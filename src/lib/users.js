import prisma from "./prisma.js";
import { app } from "../app.js";
import { sample } from "./utils.js";

export const getUserRecord = async (userId) => {
  let user
  try {
    user = await app.client.users.profile.get({ user: userId });
  }
  catch (e) {
    console.log(userId)
    console.error(e)
    return
  }
  if (user.profile === undefined) return;
  let record = await prisma.accounts.findUnique({
    where: {
      slackID: userId,
    },
  });
  if (record === null) {
    let profile = await app.client.users.info({ user: userId });
    let username =
      user.profile.display_name !== ""
        ? user.profile.display_name.replace(/\s/g, "")
        : user.profile.real_name.replace(/\s/g, "");
    let tzOffset = profile.user.tz_offset;
    let tz = profile.user.tz.replace(`\\`, "");
    let checkIfExists = await prisma.accounts.findFirst({
      where: { username: username },
    });
    record = await prisma.accounts.create({
      data: {
        slackID: userId,
        username: `${username}${checkIfExists != null ? `-${userId}` : ""}`,
        streakCount: 0,
        email: user.profile.fields.email,
        website: user.profile.fields["Xf5LNGS86L"]?.value || null,
        github: user.profile.fields["Xf0DMHFDQA"]?.value || null,
        newMember: true,
        avatar: user.profile.image_192,
        timezoneOffset: tzOffset,
        timezone: tz,
      },
    });
    if (!user.profile.is_custom_image) {
      const animalImages = [
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/2njP1JWx.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/3NdOZWDB.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/4l8dV3DJ.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/5Ej6Ovlq.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/6VG29lvI.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/7tDusvvD.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/863H1hQM.jpg",
        "https://cloud-h1wvrbj1u-hack-club-bot.vercel.app/9xGtLTa3.png",
      ];
      const animalImage = sample(animalImages);
      await prisma.accounts.update({
        where: { slackID: userId },
        data: { avatar: animalImage },
      });
    }
  }
  return { ...record, slack: user };
};

export const forgetUser = async (user) => {
  await Promise.all([
    await prisma.updates.deleteMany({
      // delete their updates...
      where: {
        slackID: user,
      },
    }),
    await prisma.accounts.deleteMany({
      // delete their account
      where: {
        accountsSlackID: user,
      },
    }),
  ]);
};

export const canDisplayStreaks = async (userId) => {
  let record = await getUserRecord(userId);
  return record.displayStreak;
};
