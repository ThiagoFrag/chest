/**
 * Centralized constants for container/volume naming and labels.
 * Single source of truth — change here to rebrand or adjust prefixes.
 */

export const CONTAINER_PREFIX = "forja-";
export const SIDECAR_PREFIX = "chest-bluemap-";
export const SIDECAR_VOLUME_PREFIX = "forja-bluemap-";
export const MANAGED_LABEL = "forja.managed";
export const DISPLAY_LABEL = "forja.display";
export const SLUG_LABEL = "forja.slug";
export const SIDECAR_LABEL = "forja.bluemap";
export const SIDECAR_PARENT_LABEL = "forja.bluemap.parent";

export const MC_IMAGE = "itzg/minecraft-server:java21";
export const SIDECAR_IMAGE = "eclipse-temurin:21-jre";

export const MC_PORT_RANGE = { start: 25565, end: 25600 };
export const RCON_PORT_RANGE = { start: 25700, end: 25800 };
export const MAP_PORT_RANGE = { start: 8100, end: 8200 };
