const pokeCard = document.querySelector('[data-poke-card]');
const pokeName = document.querySelector('[data-poke-name]');
const pokeImg = document.querySelector('[data-poke-img]');
const pokeId = document.querySelector('[data-poke-id]');
const pokeTypes = document.querySelector('[data-poke-types]');
const pokeStats = document.querySelector('[data-poke-stats]');

const pokebolaOverlay = document.getElementById('pokebola-overlay');
const splashScreen = document.getElementById('splash-screen'); 
const pokemonListContainer = document.getElementById('pokemon-list-container'); 
const favoritesToggleBtn = document.getElementById('favorites-toggle'); 
const favoriteButton = document.getElementById('favorite-button'); 
const exitButton = document.getElementById('exit-button');
const exitScreen = document.getElementById('exit-screen');

// CONSTANTES
const POKEMON_COUNT = 151;
const API_URL = `https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_COUNT}`;
const STORAGE_KEY = 'pokedexFavorites'; 

let currentPokemonList = []; 
let isShowingFavorites = false; 

// Colores (sin cambios)
const typeColors = {
    electric: '#FFEA70', normal: '#B09398', fire: '#FF675C', water: '#0596C7',
    ice: '#AFEAFD', rock: '#999799', flying: '#7AE7C7', grass: '#4A9681',
    psychic: '#FFC6D9', ghost: '#561D25', bug: '#A2FAA3', poison: '#795663',
    ground: '#D2B074', dragon: '#DA627D', steel: '#1D8A99', fighting: '#2F2F2F',
    default: '#2A1A1F',
};


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('splash-screen--hidden');
        }
    }, 3000); 

    fetchPokemonList(API_URL);
    if (favoritesToggleBtn) {
        favoritesToggleBtn.addEventListener('click', toggleView);
    }
    if (exitButton) {
        exitButton.addEventListener('click', showExitScreen);
    }
});

async function fetchPokemonList(url) {
    try {
        pokemonListContainer.innerHTML = '<li class="pokemon-list__item">Cargando Pokémon...</li>';
        const response = await fetch(url);
        const data = await response.json();
        
        currentPokemonList = data.results; 
        renderPokemonList(currentPokemonList);
    } catch (error) {
        console.error("Error al obtener la lista de Pokémon:", error);
        pokemonListContainer.innerHTML = '<li class="pokemon-list__item">Error al cargar la lista.</li>';
    }
}

function renderPokemonList(pokemonArray) {
    pokemonListContainer.innerHTML = '';
    
    pokemonArray.forEach(pokemon => {
        const listItem = document.createElement('li');
        listItem.classList.add('pokemon-list__item');
        listItem.textContent = formatName(pokemon.name); 
        
        listItem.addEventListener('click', () => {
            fetchPokemonDetails(pokemon.url); 
        });

        pokemonListContainer.appendChild(listItem);
    });
}

function toggleView() {
    isShowingFavorites = !isShowingFavorites;
    const favorites = getFavorites();
    
    if (isShowingFavorites) {
        favoritesToggleBtn.textContent = 'Mostrar Lista Completa';
        
       
        renderPokemonList(favorites.length > 0 ? favorites : []); 
        
        if (favorites.length === 0) {
            pokemonListContainer.innerHTML = '<li class="pokemon-list__item">No tienes Pokémon favoritos guardados.</li>';
        }

    } else {
        favoritesToggleBtn.textContent = 'Mostrar Favoritos';
        renderPokemonList(currentPokemonList); 
    }
}


const searchPokemon = event => {
    event.preventDefault();
    const { value } = event.target.pokemon;
    fetchPokemonDetails(value);
}

async function fetchPokemonDetails(urlOrName) {
    pokebolaOverlay.classList.remove('hidden'); 
    
    let url = urlOrName.startsWith('http') 
        ? urlOrName 
        : `https://pokeapi.co/api/v2/pokemon/${urlOrName.toLowerCase()}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Pokémon no encontrado');
        }
        const data = await response.json();
        
        setTimeout(() => {
            pokebolaOverlay.classList.add('hidden');
            renderPokemonData(data);
        }, 2000); 

    } catch (error) {
        console.error("Error al obtener el detalle:", error);
        setTimeout(() => {
            pokebolaOverlay.classList.add('hidden');
            renderNotFound();
        }, 2000); 
    }
}

const renderPokemonData = data => {
    const sprite = data.sprites.front_default;
    const { stats, types } = data;

    pokeName.textContent = formatName(data.name);
    pokeImg.setAttribute('src', sprite);
    pokeId.textContent = `Nº ${data.id}`;
    setCardColor(types);
    renderPokemonTypes(types);
    renderPokemonStats(stats);
    
    favoriteButton.setAttribute('data-pokemon-id', data.id);
    favoriteButton.setAttribute('data-pokemon-name', formatName(data.name));
    updateFavoriteButton(data.id);
}

function getFavorites() { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
}

function saveFavorites(favoritesArray) { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesArray)); 
}

function toggleFavorite() {
    const id = parseInt(favoriteButton.getAttribute('data-pokemon-id'));
    const name = favoriteButton.getAttribute('data-pokemon-name');
    
    if (!id || !name || name === 'Pokedex' || isNaN(id)) return;

    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === id);
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`; 

    if (index === -1) {
        favorites.push({ id, name, url }); 
    } else {
        favorites.splice(index, 1);
    }
    
    saveFavorites(favorites);
    updateFavoriteButton(id); 
    
    if (isShowingFavorites) {
        renderPokemonList(favorites);
    }
}

function updateFavoriteButton(pokemonId) {
    const favorites = getFavorites();
    const isFavorite = favorites.some(fav => fav.id === pokemonId);
    
    favoriteButton.classList.toggle('poke-card__favorite-btn--is-favorite', isFavorite);
    favoriteButton.textContent = isFavorite ? '❤️ Quitar' : '⭐ Favorito';
}

function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

const setCardColor = types => {
    const colorOne = typeColors[types[0].type.name];
    const colorTwo = types[1] ? typeColors[types[1].type.name] : typeColors.default;
    pokeImg.style.background = `radial-gradient(${colorTwo} 33%, ${colorOne} 33%)`;
    pokeImg.style.backgroundSize = ' 5px 5px';
}

const renderPokemonTypes = types => {
    pokeTypes.innerHTML = '';
    types.forEach(type => {
        const typeTextElement = document.createElement("div");
        typeTextElement.style.color = typeColors[type.type.name];
        typeTextElement.textContent = type.type.name;
        pokeTypes.appendChild(typeTextElement);
    });
}

const renderPokemonStats = stats => {
    pokeStats.innerHTML = '';
    stats.forEach(stat => {
        const statElement = document.createElement("div");
        const statElementName = document.createElement("div");
        const statElementAmount = document.createElement("div");
        statElementName.textContent = stat.stat.name;
        statElementAmount.textContent = stat.base_stat;
        statElement.appendChild(statElementName);
        statElement.appendChild(statElementAmount);
        pokeStats.appendChild(statElement);
    });
}

const renderNotFound = () => {
    pokeName.textContent = 'No encontrado';
    pokeImg.setAttribute('src', './pikachu.gif'); 
    pokeImg.style.background =  '#fff';
    pokeTypes.innerHTML = '';
    pokeStats.innerHTML = '';
    pokeId.textContent = '';
    
    favoriteButton.setAttribute('data-pokemon-id', ''); 
    favoriteButton.textContent = '⭐ Favorito';
    favoriteButton.classList.remove('poke-card__favorite-btn--is-favorite');
}
function showExitScreen() {
    if (exitScreen) {
        exitScreen.classList.remove('hidden');
        document.querySelector('body').style.overflow = 'hidden';
    }
}
