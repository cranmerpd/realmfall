const VERSION = "0.40";
const HISTORY = [
  {
    v: "0.40",
    date: "14 Oct 2026",
    items: [
      "The mineral is coal, not ore. A province still produces nothing that is not in its ground, and it still needs the age that knows how to work it.",
      "Income is pretax. The tax rate follows the government, the army, and what was spent last year. It does not follow income, so the two cannot chase each other. Revenue is that income times the rate. Upkeep, including ports, comes out of the treasury.",
      "Discovery is paid for over years. Cities make it faster. A neighbor or a trade partner who is already ahead makes it faster. A stockpile does not. Hunger can pause it. It does not buy the age in one season.",
      "A port is built only by a coastal city, and only when that city can pay. A town cannot have one. A coastal city does not receive one for standing on the water. An oligarchy feeds its ports first.",
      "People walk toward higher pretax income, including onto empty land. The people who arrive are the people who left. A village can stand there. A town that is not hungry, and whose own income covers a year of court, can raise a monarchy. That realm holds only that province.",
      "Neighboring provinces that are angry while the rest of the realm is quiet rise together and leave. Anger across the whole realm is different: a revolution changes the government and the realm stays one, and a civil war splits a bloc off. Faith and a lost war are not part of that anger yet.",
      "Raising an army does not remove people from the province. The men who die are removed. Disbanding does not invent them back."
    ]
  },
  {
    v: "0.39",
    date: "14 Oct 2026",
    items: [
      "Grain, timber, ore, oil, and silicon all rise with the number of people working that province. A later age raises what the same hands can draw from the land. Grain does not sit in a bottomless store: what is not eaten or kept for two years is gone.",
      "Births and deaths follow whether people ate. A government does not grant extra children, and calling a place a city does not make room for more of them. A city is 40,000 people. A metropolis is a million on that square.",
      "Who eats first follows the government. A republic feeds each province from its own harvest, then shares what is left. A monarchy or a dictatorship feeds the capital first. An oligarchy feeds the ports. A theocracy feeds the faithful.",
      "A hungry province can still lose people, onto empty land or toward food. A fed border province can still send settlers. Hunger does not freeze the realm.",
      "A ship can cross an ocean. The people who land are the people who left, and the shore becomes a province of the realm that sent them. A new realm still has to be raised by people living on land no crown holds.",
      "Settlers clear farmland. Towns are not planted on adjacent squares."
    ]
  },
  {
    v: "0.38",
    date: "14 Oct 2026",
    items: [
      "A city's name follows its people. Calling a town a metropolis no longer raises its wages or how many it can hold, so the rank cannot promote itself. A metropolis is a city of a very large country, not the ordinary capital.",
      "A new country is the people who landed, in one settlement. They are not divided into provinces of forty and then rounded back to forty. Forty people can have children. A dead colony no longer seals the rest of its continent."
    ]
  },
  {
    v: "0.37",
    date: "14 Oct 2026",
    items: [
      "Grain is harvested into the province that grew it and eaten there first. Only the surplus goes into the realm store. That store feeds the provinces that fell short, and what remains can be sold.",
      "A full store is eaten. Hunger with grain sitting unused does not happen. When the store runs short, the price rises: a province that sells timber, ore, oil, or grain can buy food, and a province with nothing to sell eats less.",
      "People move toward a neighboring province that pays better. A city and a worked good pay. A field far from a market pays little. The countryside thins because the wage is elsewhere, not because a rule sets its population.",
      "Goods squares are fewer. Each one that is worked yields more, and the people who live on it are paid from that.",
      "A coastal tip is a natural place to settle. It is not punished for being a coast."
    ]
  },
  {
    v: "0.36",
    date: "14 Oct 2026",
    items: [
      "A realm was only stepping onto the coast, because a coastal square outscored the land behind it. It now fills the country it already touches, inland as well as shore.",
      "Provinces that touch at a corner count as connected. A coastal strip is no longer treated as cut off, and cut-off land is never erased back to empty."
    ]
  },
  {
    v: "0.35",
    date: "14 Oct 2026",
    items: [
      "People who leave are subtracted. People who arrive are those same people. Migration does not invent a population.",
      "A crown expands when a border province is crowded and the empty land is worth sending people to. It sends them from that province. It does not paint a square where settlers already live.",
      "Settlers can walk onto land no realm holds. That province grows by the people who come and by the children born there. A town can stand there before any crown does. When the town is a real population, those people raise a government, and that is a new country."
    ]
  },
  {
    v: "0.34",
    date: "14 Oct 2026",
    items: [
      "A province no longer fills to a fixed number and stops. Worked fields hold more people. More hands on a field raise the harvest. A new age raises both. Towns can be founded in a country that has the people to spare, and they draw population out of the countryside.",
      "A drought still kills. The country can climb past the old line afterward, instead of stopping at the same number every time."
    ]
  },
  {
    v: "0.33",
    date: "14 Oct 2026",
    items: [
      "Tax is a share of the product. GDP is the harvest, what was cut or dug, what the cities made, and the trade of that year. A head count is no longer the tax.",
      "A sale is part of that product. The buyer pays coin and receives the goods. Grain bought abroad is eaten by the hungry provinces. The price rises when the buyer is short.",
      "Every people still begins as a monarchy. A fed country keeps its crown. A hungry country that keeps paying, or a coast that lives by trade and resents the customs, can throw the crown out. It is not common, and it is not impossible."
    ]
  },
  {
    v: "0.32",
    date: "14 Oct 2026",
    items: [
      "The seasons govern the harvest. Spring plants. A hot, dry summer can fail the rains, and a drought that has already begun is more likely to continue. Autumn is the harvest. Winter spends what was stored, and cold country loses more people.",
      "War, trade, learning, settlement, and politics are not saved up for one season. They happen through the year. Winter still slows a march and drowns more of a winter voyage. It does not switch the world off.",
      "No faith is on the map at the start, and there is no list of three waiting to be filled. A faith is born among a people, early and not often, the way a realm is born. It then spreads from the people who keep it to the people beside them. Later faiths are rarer. A theocracy can only preach a faith the people already follow."
    ]
  },
  {
    v: "0.31",
    date: "9 Oct 2026",
    items: [
      "A hungry country is slowed, not switched off. It can still settle, learn, and put to sea. Only a real famine stops it.",
      "Coin is spent when people actually settle. A failed attempt no longer drains the treasury.",
      "A fed country pays a tax on its people, so the treasury is not stuck at nothing while the realm sits still.",
      "People who walk onto empty land remain part of the realm.",
      "A ship that reaches a shore the crown cannot walk to founds a new people there. It does not paint the old realm across the ocean.",
      "A realm that has stretched too far can lose a distant march. It is not cut in half.",
      "Starting a new map no longer loses the people, which happened when the old realm list was still in memory."
    ]
  },
  {
    v: "0.30",
    date: "9 Oct 2026",
    items: [
      "The world begins with one small people. The rest of the land is empty. Other realms come later, by breaking away, not by being placed at the start.",
      "No faith is painted on the map at the start. A faith can begin among a primitive people, and more rarely once they can cut timber. It then spreads from the people who hold it to the people beside them.",
      "Empty land has no population. People grow where they are fed, and a field that is feeding them grows faster than a province that is hungry.",
      "Climate is a globe. Land sits in both hemispheres. Both poles are cold, the middle is warm, and high ground is cold whether or not it sits near a pole.",
      "A sale is an exchange. The seller loses the goods and gains the coin. The buyer loses the coin and gains the goods. If the buyer cannot pay, the cargo goes home and nothing is added to the treasury."
    ]
  },
  {
    v: "0.29",
    date: "9 Oct 2026",
    items: [
      "A delivery is a trade. Grain landed on a realm's own shore is recorded, and so is grain a barge carries to a city or a partner. Last trade stays empty only when nothing has been delivered.",
      "A realm keeps more than one merchant. An oligarchy or a republic with several ports keeps the most. A dictatorship keeps fewer. A hull that has nothing to carry waits in port. It is not sold and bought again.",
      "A barge is bought once. When the grain is delivered it sits idle on the river until the next load, instead of vanishing.",
      "Fields are on the Goods map. Grain comes from those provinces. High ground and a mine are not a farm, so food is no longer an invisible yield on every square.",
      "The Water sheet is now Trade and Military. Trade is merchants, barges, and the last delivery. Military is armies, warships, and wings.",
      "A wing is not a ship. Steam, carrack, or sail is counted from the hulls that exist. A new ship is steam only after the oil age, a carrack after metal, and sail after timber.",
      "Those same ages change speed. A rifle army marches farther in a season than a levy. A steam hull takes more water in a season than a sail. A wing is the fastest of them."
    ]
  },
  {
    v: "0.28",
    date: "9 Oct 2026",
    items: [
      "A war is a run of skirmishes. A victory occupies a province. It is not annexed that day.",
      "Annexation comes later. A dictatorship takes occupied land quickly. A republic argues about it, and often hands it back at the peace.",
      "Grain, timber, ore, oil, and silicon can all be sold. A republic or an oligarchy looks for the bargain. A dictatorship rarely will. The buyer pays coin, and can use the stock only for an age it has already learned.",
      "Every realm has a leader. A republic elects the next one. A dictatorship changes hands when the country will not bear the person in it. Spies steal, and sometimes assassinate. A caught spy costs a republic more than it costs a dictatorship.",
      "The log for a selected realm is that realm's own history. The world chronicle is still underneath it."
    ]
  },
  {
    v: "0.27",
    date: "9 Oct 2026",
    items: [
      "A realm does not learn from its neighbors, and a new realm does not inherit an age. The next age is bought with coin, and only if that resource is in its own land.",
      "A republic pays less. A dictatorship pays less for metal and more for timber. A theocracy pays more for oil and silicon.",
      "A hungry crown, a failed cult, or a dictatorship the country will not feed can be overthrown. The usual result is a democratic republic. A republic no longer votes itself away at the first lean year.",
      "A war takes a province only when an army, a wing, or a warship is there. The men in that fight die, and more of them die in a cold winter."
    ]
  },
  {
    v: "0.26",
    date: "9 Oct 2026",
    items: [
      "Every realm starts primitive. A levy can be raised at once. Timber, ore, oil, and silicon cannot be worked until that realm learns how.",
      "Learning follows the land and the neighbors. Timber allows barges and slow ships. Ore allows heavier arms and faster hulls. Oil powers the ships. Silicon allows a wing and a missile.",
      "A realm that breaks away keeps what its people already knew. A new realm beside a silicon power at least knows how to cut wood.",
      "A skirmish is not a war. It spends blood and a little grain, and a winter skirmish spends more. A war is still the thing that takes provinces."
    ]
  },
  {
    v: "0.25",
    date: "9 Oct 2026",
    items: [
      "Climate is a map of its own, beside States, Faith, and Goods. Each province is shaded for the winter it actually has."
    ]
  },
  {
    v: "0.24",
    date: "9 Oct 2026",
    items: [
      "The north and the high ground have harder winters. A low coast is milder. The hover and the Country sheet say which.",
      "A cold province grows less grain. A short harvest kills more people in a hard winter than in a mild one. A supplied army on a mild coast is spared. A hungry army in the cold is not.",
      "A war can fall in any season, including winter. A realm still takes the same one or two provinces in a year."
    ]
  },
  {
    v: "0.23",
    date: "9 Oct 2026",
    items: [
      "A war is fought in spring, summer, and autumn. Winter the army holds.",
      "A realm still takes the same one or two provinces in a year. The cost of the campaign is still paid once."
    ]
  },
  {
    v: "0.22",
    date: "9 Oct 2026",
    items: [
      "The clock is Spring, Summer, Autumn, Winter. The same work still happens once a year, in that order.",
      "Spring is births and the start of a drought. Autumn is the harvest, the hunger, and the tax. Winter is war, settlement, and movement. Summer does not run them again."
    ]
  },
  {
    v: "0.21",
    date: "9 Oct 2026",
    items: [
      "A theocracy adjusting its strength in a fight no longer stops the year."
    ]
  },
  {
    v: "0.20",
    date: "9 Oct 2026",
    items: [
      "Faith is painted province by province. A cell takes the color of its majority, and a line is drawn where that majority changes.",
      "People are influenced by the people next to them. A faith crosses a border slowly and does not wipe the old one out.",
      "A theocracy preaches only inside its own land, stronger in its towns. It will not make peace with another cult, and it goes to war when a neighbor does not keep the faith or holds the cult's people."
    ]
  },
  {
    v: "0.19",
    date: "9 Oct 2026",
    items: [
      "Timber and ore only pay well if a river, a coast, or a town can carry them. A theocracy collects less where the cult is not believed.",
      "A broke realm settles less, loses people, fights worse, and can be forced to make peace. Sacking a city or a capital takes coin and stocks.",
      "Empty land with timber or ore is settled first. A trade peace can be made because one realm has the good the other lacks.",
      "A revolt can be a province keeping its ore or timber instead of sending it to the capital."
    ]
  },
  {
    v: "0.18",
    date: "9 Oct 2026",
    items: [
      "Each realm has a treasury. Tax is a share of timber, ore, and the grain that reaches the ports. The rate depends on the government.",
      "Prosperity now includes the treasury and the stocks. A broke realm loses legitimacy, cannot raise an army, and cannot keep a hull at sea.",
      "A merchant sells grain, timber, or ore. The buyer pays coin, and sometimes sends the other good home.",
      "Goods on the map shows timber and ore. A neighbor who has what you lack can be a reason for war."
    ]
  },
  {
    v: "0.17",
    date: "9 Oct 2026",
    items: [
      "A warship patrols its own coast in peace. In a war it crosses the ocean to the enemy coast, then comes home when the war ends.",
      "A barge carries surplus grain downriver again. It still stops at a border unless there is a pact.",
      "A merchant ship crosses the sea to a colony or a trade partner, delivers grain, and sails home for another load.",
      "An army is called an army."
    ]
  },
  {
    v: "0.16",
    date: "9 Oct 2026",
    items: [
      "A warship patrols its own coast and turns around. It does not cross the sea to another holding.",
      "A barge stays inside the border. It hands grain to the next country only when the two have a river pact.",
      "The Water sheet counts every hull on the map, so the number matches what you see."
    ]
  },
  {
    v: "0.15",
    date: "9 Oct 2026",
    items: [
      "A barge only leaves when a city downstream is short of grain. One boat on a river, and the panel says which city it is feeding.",
      "The word cog is gone. A grain ship sails only to a far port that is actually hungry, delivers, and is done."
    ]
  },
  {
    v: "0.14",
    date: "9 Oct 2026",
    items: [
      "A realm opens on Brief, Country, Rule, or Water, instead of one long list of every number."
    ]
  },
  {
    v: "0.13",
    date: "9 Oct 2026",
    items: [
      "Coasts are no longer a darker band. A shore is just the edge of the land.",
      "The map runs east to west without a wall. The far north and far south stay ocean, so a continent is not cut flat by the frame.",
      "A fed realm keeps settling empty land in front of it. A little hunger no longer freezes the frontier for good."
    ]
  },
  {
    v: "0.12",
    date: "9 Oct 2026",
    items: [
      "Boats slide along the route they are taking, instead of jumping a square at a time.",
      "A cog is a grain ship. The faint line is its route. It is not a warship, and grain is not money.",
      "The panel counts a realm's own barges, cogs, and warships. Other boats on its rivers are listed apart, so the map and the numbers match."
    ]
  },
  {
    v: "0.11",
    date: "9 Oct 2026",
    items: [
      "Barges, cogs, warships, and hosts are on the map. Hover one to see whose it is.",
      "A barge carries grain. It can feed a city downstream, or be taken if the river is at war.",
      "A cog spends grain to cross water, to a colony or a trade partner. A warship costs grain to keep at sea, and a landing without one is much weaker.",
      "A host is people taken off the land. It has to be fed from the grain, and a fight goes worse where no host is standing."
    ]
  },
  {
    v: "0.10",
    date: "9 Oct 2026",
    items: [
      "A republic votes. Merchants, the ports, the country, a cult, or a hard hand can keep it or replace it. Hunger, faith, and fear decide the weight.",
      "A coast that has learned the water can send people across it. The crossing costs the port. The new shore is held only while the ships can still reach it."
    ]
  },
  {
    v: "0.9",
    date: "9 Oct 2026",
    items: [
      "Leaving the tab no longer fast-forwards the world. The years wait, and coming back does not freeze the page.",
      "The simulation is split into separate files so it can keep growing.",
      "This notes list is the version history."
    ]
  },
  {
    v: "0.8",
    date: "9 Oct 2026",
    items: [
      "A new province is settled by people who leave a neighboring square. The people already living there are not a free gift.",
      "Borders follow the government. Republics take outsiders in and grow less united. Monarchies and dictatorships do not. Oligarchies only want them at a port or on a river. Theocracies only want their own cult.",
      "A hungry country loses people. Drought fails a whole river basin, not a random square."
    ]
  },
  {
    v: "0.7",
    date: "9 Oct 2026",
    items: [
      "Grain moves downstream. Towns eat, then the next city, then the sea.",
      "A city that outgrows its basin goes hungry and shrinks. A war on the river stops the grain."
    ]
  },
  {
    v: "0.6",
    date: "9 Oct 2026",
    items: [
      "Every river reaches the sea, joining another if it has to.",
      "Settlements are villages, towns, cities, great cities, or a metropolis. The mark grows and shrinks with the people."
    ]
  },
  {
    v: "0.5",
    date: "9 Oct 2026",
    items: [
      "People are born and die by place, not a single ceiling for the whole country.",
      "Towns are founded where the country can spare people. A capital that falls does not hop to the next square."
    ]
  },
  {
    v: "0.4",
    date: "9 Oct 2026",
    items: [
      "Faith is a mix in each province. It spreads by who lives next door, not by the flag.",
      "Monarchy, republic, dictatorship, oligarchy, and theocracy change growth, war, and legitimacy."
    ]
  },
  {
    v: "0.3",
    date: "9 Oct 2026",
    items: [
      "Continents are landmasses, not one island. Realms fight, and a breakaway has to be a real place rather than scattered squares."
    ]
  },
  {
    v: "0.1",
    date: "9 Oct 2026",
    items: [
      "First playable world in the browser."
    ]
  }
];
