
-- Insert more marathon collections
INSERT INTO public.marathons (id, title, description, poster_path, backdrop_path, position, is_active) VALUES
  ('a1000001-0000-0000-0000-000000000009', 'Piratas do Caribe', 'Toda a aventura do Capitão Jack Sparrow. 5 filmes em sequência.', '/9Xcg7Ar4ketv4rl8yeK32yp9zQA.jpg', '/pDzJBfZsYlOLMbQ3lkpNtKfJ1z5.jpg', 9, true),
  ('a1000001-0000-0000-0000-000000000010', 'Jogos Vorazes', 'A saga completa de Katniss Everdeen. Da Arena à Revolução.', '/l6jn53LMu07uPt8A42JWIKi1Beb.jpg', '/bSifqB2J7ySS5bwiWmXUvtvu9gy.jpg', 10, true),
  ('a1000001-0000-0000-0000-000000000011', 'Indiana Jones', 'As aventuras do arqueólogo mais famoso do cinema. 5 filmes clássicos.', '/mtf7iKZRdsL6qbbCnd2TAxOfJYg.jpg', '/15fxEH7aFNbIAyJD50kXs4yr19.jpg', 11, true),
  ('a1000001-0000-0000-0000-000000000012', 'Planeta dos Macacos', 'A saga completa dos primatas. Da origem ao reinado.', '/qxe4ONZAgtC0mfsIuOyqVU9JREj.jpg', '/MdIqr5aUxjOqQly2aJWlBQ2rkQ.jpg', 12, true);

-- Piratas do Caribe items
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000009', 'e941a823-70b3-4b77-a709-194910193355', 'movie', 'Piratas do Caribe: A Maldição do Pérola Negra', '/9Xcg7Ar4ketv4rl8yeK32yp9zQA.jpg', 1),
  ('a1000001-0000-0000-0000-000000000009', '4981a49b-d1ad-41bf-964f-c6717d1b6b89', 'movie', 'Piratas do Caribe: O Baú da Morte', '/yvD1G41HwHgj8afCjmfGbyRmBBR.jpg', 2),
  ('a1000001-0000-0000-0000-000000000009', 'b59d25b9-24ec-4a28-8b35-f08147f82736', 'movie', 'Piratas do Caribe: No Fim do Mundo', '/j15lZasREutscon6e61LSSNJoN7.jpg', 3),
  ('a1000001-0000-0000-0000-000000000009', '8bbe7a7a-af16-4216-94ff-2d2b7ed8bb1f', 'movie', 'Piratas do Caribe: Navegando em Águas Misteriosas', '/blt7kBXEk1HgJjCTusaUMQ7BCTY.jpg', 4),
  ('a1000001-0000-0000-0000-000000000009', '198e02af-3ccf-42c2-846d-fc1929379c56', 'movie', 'Piratas do Caribe: A Vingança de Salazar', '/1bXv1lIkXE1TXYsyd6HHQr4dfw4.jpg', 5);

-- Jogos Vorazes items
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000010', 'be069b16-a4ea-4aa5-a221-89698d49a99e', 'movie', 'Jogos Vorazes', '/l6jn53LMu07uPt8A42JWIKi1Beb.jpg', 1),
  ('a1000001-0000-0000-0000-000000000010', '64e97de4-0b56-4b6f-8efb-b79fb239dbe0', 'movie', 'Jogos Vorazes: Em Chamas', '/m1lky5ftnhLRpkoYWKssH8qvlRU.jpg', 2),
  ('a1000001-0000-0000-0000-000000000010', '93a7be3d-8899-41cb-92f1-c767cf02102a', 'movie', 'Jogos Vorazes: A Esperança - Parte 1', '/hekpVNWOROZm57RS4OLW0ySkxx9.jpg', 3),
  ('a1000001-0000-0000-0000-000000000010', '5365f41f-c3d1-4eea-b502-7ecf12596fc8', 'movie', 'Jogos Vorazes: A Esperança - O Final', '/5KSQkozSelQj6bq8NCKtINvsSSj.jpg', 4),
  ('a1000001-0000-0000-0000-000000000010', '18585565-e712-4710-8c51-803d75ce401c', 'movie', 'Jogos Vorazes: A Cantiga dos Pássaros e das Serpentes', '/a9z2cmIBfx99dtzj8TaSFU50AnW.jpg', 5);

-- Indiana Jones items
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000011', 'ee88a253-e939-4e53-bd39-391a50b37cb8', 'movie', 'Indiana Jones e os Caçadores da Arca Perdida', '/mtf7iKZRdsL6qbbCnd2TAxOfJYg.jpg', 1),
  ('a1000001-0000-0000-0000-000000000011', '2e78bd5b-19c8-43a8-8c28-9be9cb3d8fa5', 'movie', 'Indiana Jones e o Templo da Perdição', '/zhcPKAXEWW76ZAjzsEm3XsHxD05.jpg', 2),
  ('a1000001-0000-0000-0000-000000000011', 'f61460e8-f667-44ea-9391-cff6072f3006', 'movie', 'Indiana Jones e a Última Cruzada', '/cJP4wT4RB85E3gbwRe3LWJORXXM.jpg', 3),
  ('a1000001-0000-0000-0000-000000000011', 'd73a5706-b881-435e-b90e-b1806043147c', 'movie', 'Indiana Jones e o Reino da Caveira de Cristal', '/eZpDX7wTxllhVxhc9Qy9xN4G2Nw.jpg', 4),
  ('a1000001-0000-0000-0000-000000000011', 'eb9de252-78af-45a7-9e27-edc34e6f6859', 'movie', 'Indiana Jones e A Relíquia do Destino', '/2vTsUU93ZHJlvpQukmvIWABD3HL.jpg', 5);

-- Planeta dos Macacos items (trilogia moderna)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000012', '7a5aa39c-d293-46a0-ad22-ad8d81cb41ae', 'movie', 'Planeta dos Macacos: A Origem', '/qxe4ONZAgtC0mfsIuOyqVU9JREj.jpg', 1),
  ('a1000001-0000-0000-0000-000000000012', '2fa85741-d54b-4037-9a27-12764abeb9b2', 'movie', 'Planeta dos Macacos: O Confronto', '/4vLhF6R3lmhTjTVUdK4gI1s5a8v.jpg', 2),
  ('a1000001-0000-0000-0000-000000000012', 'f144f1c3-ffdb-43f9-ae19-700f93d61c6e', 'movie', 'Planeta dos Macacos: A Guerra', '/n336SuXSxpQkrzWJbSAeWFcKWy4.jpg', 3),
  ('a1000001-0000-0000-0000-000000000012', 'c15c9a28-ba8f-460c-9b8c-6ee2a1320b0f', 'movie', 'Planeta dos Macacos: O Reinado', '/hBGnLm2A1TapONoPo7QrMpj2B6B.jpg', 4);
