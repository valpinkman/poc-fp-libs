import { Either } from "purify-ts";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Move, MoveMeta, PokeApiError, Pokemon } from "../common/types";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const POKEMON_DOMAIN = "pokemon";

export const fetchPokemonData = (
  search: string
): EitherAsync<PokeApiError, Pokemon> =>
  EitherAsync(async ({ throwE }) => {
    const url = `${POKEAPI_BASE}/${POKEMON_DOMAIN}/${search}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (reason: unknown) {
      throwE(new PokeApiError(`Could not find informations for ${search}`));
    }
  });

export const getStrongestMove = (
  moves: Either<PokeApiError, MoveMeta[]>
): Either<PokeApiError, any> => {
  return moves;
};

export const fetchMove = (url: string): EitherAsync<PokeApiError, Move> =>
  EitherAsync(async ({ throwE }) => {
    try {
      const res = await fetch(url);
      const json = res.json();
      return json;
    } catch (reason: unknown) {
      throwE(new PokeApiError("could not get move"));
    }
  });

export const findStrongest = (moves: Move[]) =>
  moves.reduce(
    (acc, { power, pp, name }) => {
      if (power > acc.power) {
        return {
          power,
          pp,
          name,
        };
      }

      return acc;
    },
    { power: 0, pp: 0, name: "" }
  );

export const findStrongestMove = (search: string) =>
  // Fetch Pokemon
  EitherAsync.fromPromise(() => fetchPokemonData(search))
    // Get all the moves
    .map((pokemon) => pokemon.moves)
    // Using chain bebause we are returning another level of Either here, it's the `flatMap` of purify-ts
    .chain(async (moves) => {
      // Creating an array or URLs
      const seq = moves.map((m) => m.move.url);
      // Like Promise.all but handles Either
      return EitherAsync.all(seq.map((s) => fetchMove(s)));
    })
    // Find strongest moves (reduced value)
    .map(findStrongest);
