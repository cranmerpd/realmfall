const VERSION = "0.28";
const HISTORY = [
  {
    v: "0.28",
    date: "9 Oct 2026",
    items: [
      "A skirmish occupies a province. It is not annexed. A dictatorship takes that land in four years. A republic waits longer, and longer still when it is not trusted.",
      "At a peace, ground that has been held is annexed. Ground that has not is handed back.",
      "Each realm has a leader, and keeps a history of what was written about it. A monarch dies and another takes the crown. A republic elects. A restless dictatorship changes hands.",
      "A crown can send a spy. The spy may be caught, may kill a leader, or may steal from a treasury."
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
