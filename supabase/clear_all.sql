-- SQL Script to completely drop and clear all Pastry Picasso tables from public schema

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.customers cascade;
drop table if exists public.reviews cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.business_settings cascade;
drop table if exists public.admins cascade;
