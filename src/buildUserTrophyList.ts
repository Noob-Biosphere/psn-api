import fs from "fs";

import {
  exchangeCodeForAccessToken,
  exchangeNpssoForCode,
  getTrophiesEarnedForTitle,
  getTrophiesForTitle,
  getTrophyTitlesForUser
} from ".";
import { Trophy } from "./models/trophy.model";
import { TrophyRarity } from "./models/trophy-rarity.model";

const npsso =
  "1ZJugQkLgxvWHAyJL48azw6rYkH28qul5zvP7et8khlElTqamBVsDcRntHRBfO0w";

export const buildUserTrophyList = async (userId: string) => {
  const accessCode = await exchangeNpssoForCode(npsso);
  const authorization = await exchangeCodeForAccessToken(accessCode);
  console.log(authorization);
  return;

  const { trophyTitles } = await getTrophyTitlesForUser(authorization, userId);

  const games: any[] = [];

  let count = 1;
  for (const title of trophyTitles) {
    const { trophies: titleTrophies } = await getTrophiesForTitle(
      authorization,
      title.npCommunicationId,
      "all",
      {
        npServiceName:
          title.trophyTitlePlatform !== "PS5" ? "trophy" : undefined
      }
    );

    const { trophies: earnedTrophies } = await getTrophiesEarnedForTitle(
      authorization,
      userId,
      title.npCommunicationId,
      "all",
      {
        npServiceName:
          title.trophyTitlePlatform !== "PS5" ? "trophy" : undefined
      }
    );

    const mergedTrophies = mergeTrophyLists(titleTrophies, earnedTrophies);

    const game = {
      gameName: title.trophyTitleName,
      platform: title.trophyTitlePlatform,
      trophyTypeCounts: title.definedTrophies,
      earnedCounts: title.earnedTrophies,
      trophyList: mergedTrophies
    };

    games.push(game);
    console.log("writing game", count);

    count += 1;
  }

  fs.writeFileSync("./games.json", JSON.stringify(games));
};

const mergeTrophyLists = (
  titleTrophies: Trophy[],
  earnedTrophies: Trophy[]
) => {
  const mergedTrophies: any[] = [];

  for (const earnedTrophy of earnedTrophies) {
    const foundTitleTrophy = titleTrophies.find(
      (t) => t.trophyId === earnedTrophy.trophyId
    );

    mergedTrophies.push(
      normalizeTrophy({ ...earnedTrophy, ...foundTitleTrophy })
    );
  }

  return mergedTrophies;
};

const normalizeTrophy = (trophy: Trophy) => {
  return {
    isEarned: trophy.earned ?? false,
    earnedOn: trophy.earned ? trophy.earnedDateTime : "unearned",
    type: trophy.trophyType,
    rarity: rarityMap[trophy.trophyRare ?? 0],
    earnedRate: Number(trophy.trophyEarnedRate),
    trophyName: trophy.trophyName,
    groupId: trophy.trophyGroupId
  };
};

const rarityMap: Record<TrophyRarity, string> = {
  [TrophyRarity.VeryRare]: "Very Rare",
  [TrophyRarity.UltraRare]: "Ultra Rare",
  [TrophyRarity.Rare]: "Rare",
  [TrophyRarity.Common]: "Common"
};
