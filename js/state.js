const COLS = 120, ROWS = 78;
const LAND = 1, WATER = 0;
const prefixes = ["Ash","Dun","Kor","Vel","Mar","Ost","Ryn","Hal","Tor","Brae","Quel","Sar","Ith","Nor","Caer","Wyn","Gal","Thal","Eld","Mir"];
const suffixes = ["wald","heim","dor","reach","mark","hold","ia","und","fen","gard","mere","wyn","oth","lan","bar","ric","moor","stead","vane","spire"];
const citySuffixes = ["ton","ford","port","burgh","haven","bridge","mouth","kirk","wick","stad"];
const colors = ["#d4655c","#e0ae58","#4eae9c","#6d90d6","#c96b9a","#e08a45","#8fb45e","#c9a06a","#3f9178","#d46d78","#b59a48","#3e8c96","#d48462","#7d74d0","#d2c15a","#5a9a55","#c45656","#4d7eb8","#d49a74","#8a8648"];

const FAITH_POOL = ["Ashen Rite", "High Canon", "Old Grove", "Sun Creed", "Pale Choir", "Iron Psalm"];
const FAITH_COLORS = ["#c4a574", "#7f97a8", "#7ea36d", "#c48b9a", "#d2c07a", "#8d7cc4"];
const GOVS = ["Monarchy", "Republic", "Dictatorship", "Oligarchy", "Theocracy"];

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
let grid, owner, prev, pop, belief, faithNames, canals, continents, nations, year, paused, selected, logLines, acc, seed, coast;
let elev, river, riverSys, flowToX, flowToY, basin, dry;
let nextId = 1;
let nextCity = 1;
let cities = [];
let units = [];
let pendingFood = null;
let nextUnit = 1;
let speed = 2;
let mapMode = "politics";
let tab = "realm";

