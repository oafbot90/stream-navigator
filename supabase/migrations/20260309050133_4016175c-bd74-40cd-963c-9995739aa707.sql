
-- Insert marathons (popular trilogies/sequences)
INSERT INTO public.marathons (id, title, description, poster_path, backdrop_path, position, is_active) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Harry Potter', 'A saga completa do bruxo mais famoso do mundo. 8 filmes em ordem cronológica.', '/4rtsbE9aQ1qw4gv7yYwaNYfWFoS.jpg', '/hziiv14OpD73u9gAak4XDDfBKa2.jpg', 1, true),
  ('a1000001-0000-0000-0000-000000000002', 'John Wick', 'A saga completa do assassino mais letal. Todos os filmes na ordem certa.', '/lBcQGk1ygGM2wYmpypFrPp0YohN.jpg', '/fSwYa5q2xRkBoOOjNBnCeM4FjEy.jpg', 2, true),
  ('a1000001-0000-0000-0000-000000000003', 'Matrix', 'Descubra a verdade sobre a realidade. A trilogia completa + Resurrections.', '/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg', '/lRMaIucMGIZR3nddMZqtrqp7W6r.jpg', 3, true),
  ('a1000001-0000-0000-0000-000000000004', 'Batman: Trilogia Cavaleiro das Trevas', 'A trilogia épica de Christopher Nolan com Christian Bale.', '/7EyhcdfiLtH0xa6CZkyYuoWL2GJ.jpg', '/9IIBboV7MCT0bTxzXHmWK1Hq558.jpg', 4, true),
  ('a1000001-0000-0000-0000-000000000005', 'Velozes & Furiosos', 'A franquia completa de corridas e ação. Do 1 ao 10!', '/rKaaYM4CtuJZFdOA0SZWbaMNHbn.jpg', '/wu1uilmhM4TdluKi2ytfz8gidTf.jpg', 5, true),
  ('a1000001-0000-0000-0000-000000000006', 'Transformers', 'Robôs gigantes em ação! Todos os filmes da franquia.', '/lkZ9gqCEjzX85lKR6Jjd1uGAXNp.jpg', '/cZ0d3rtvCsJg1bG4SDoF68sJYxb.jpg', 6, true),
  ('a1000001-0000-0000-0000-000000000007', 'Toy Story', 'A saga completa dos brinquedos mais amados do cinema.', '/6AafgfifXkFS4g2xGJZIwsPQK6P.jpg', '/n1RohH2VoK1CcHNd5bQI2MMSJ6B.jpg', 7, true),
  ('a1000001-0000-0000-0000-000000000008', 'Jurassic Park / World', 'Dos dinossauros clássicos ao mundo moderno. A saga completa.', '/mgjJ7FH4V3exsmoHwXrmsUhn0h1.jpg', '/2m1zhwdStVBnMBaDcqJmbD0pVc5.jpg', 8, true);

-- Harry Potter items (8 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'aa539ab3-4afd-4e20-92cf-86e9024ed7f6', 'movie', 'Harry Potter e a Pedra Filosofal', '/4rtsbE9aQ1qw4gv7yYwaNYfWFoS.jpg', 1),
  ('a1000001-0000-0000-0000-000000000001', 'b7582720-8f73-4755-a182-87cd8a3d7812', 'movie', 'Harry Potter e a Câmara Secreta', '/811j0Jf2D0mK1U6RxXJoZgOB29n.jpg', 2),
  ('a1000001-0000-0000-0000-000000000001', '18e71f28-bba2-4dad-a020-c1f389428791', 'movie', 'Harry Potter e o Prisioneiro de Azkaban', '/1HdMUghqlgOIvbsU9ZtO40IPRzl.jpg', 3),
  ('a1000001-0000-0000-0000-000000000001', 'b8298dba-71f2-47e2-8afa-1e443195a71c', 'movie', 'Harry Potter e o Cálice de Fogo', '/5oWB3hjzyECRBAjgWkmZinxl9qA.jpg', 4),
  ('a1000001-0000-0000-0000-000000000001', '18b80279-f741-43fa-a1ed-fc3318950972', 'movie', 'Harry Potter e a Ordem da Fênix', '/tIf9aUyNljda9MG1pjlOLHCZ3b0.jpg', 5),
  ('a1000001-0000-0000-0000-000000000001', '793003bc-0495-42d3-9f5d-09d4f1244451', 'movie', 'Harry Potter e o Enigma do Príncipe', '/hTQQ5l9mxA3Rob8PTyvrNNGuj6y.jpg', 6),
  ('a1000001-0000-0000-0000-000000000001', 'd7de2d18-0d20-4bec-8d96-7b301ea333b7', 'movie', 'Harry Potter e as Relíquias da Morte - Parte 1', '/67FVFOTaeBUQnimhCWpUkDawDct.jpg', 7),
  ('a1000001-0000-0000-0000-000000000001', 'a731f5fa-66a3-4974-914e-cbddf7117090', 'movie', 'Harry Potter e as Relíquias da Morte - Parte 2', '/yD3VosOVW8WxPUzBDpEdzfv5pGx.jpg', 8);

-- John Wick items (4 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000002', '6150e8b8-6d28-4b18-9e73-f1ad5c1fd6b4', 'movie', 'John Wick - De Volta ao Jogo', '/lBcQGk1ygGM2wYmpypFrPp0YohN.jpg', 1),
  ('a1000001-0000-0000-0000-000000000002', '08f71524-33ee-4b54-9059-904dd6f03b2f', 'movie', 'John Wick: Um Novo Dia para Matar', '/kRAHy9CQnNT16vTvtJtu9pRgjEG.jpg', 2),
  ('a1000001-0000-0000-0000-000000000002', '6b7b61b4-4ae2-42fd-86fa-e362d6f8a444', 'movie', 'John Wick 3: Parabellum', '/bE6XutmB6tcvzTHBx4JGJLlzouM.jpg', 3),
  ('a1000001-0000-0000-0000-000000000002', 'c2e09ab5-305e-4936-bc70-745aa539b087', 'movie', 'John Wick 4: Baba Yaga', '/rXTqhpkpj6E0YilQ49PK1SSqLhm.jpg', 4);

-- Matrix items (4 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000003', 'e6dbe46f-0e53-49dd-9c7e-ab4ef3b088ac', 'movie', 'Matrix', '/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg', 1),
  ('a1000001-0000-0000-0000-000000000003', '9f741fb8-2ced-4374-bff8-0dabe545bdae', 'movie', 'Matrix Reloaded', '/ayZkaN2f3ASjWW8ooCfuJT3T8Va.jpg', 2),
  ('a1000001-0000-0000-0000-000000000003', '791d7fa3-63c3-4bf6-9611-a6632d27b94f', 'movie', 'Matrix Revolutions', '/92oJ810bYqijBQ8tghRQSqLSfrkvQnA.jpg', 3),
  ('a1000001-0000-0000-0000-000000000003', '2c20b365-845e-4a4b-8c0d-ce0a3fa4f9f5', 'movie', 'Matrix Resurrections', '/9DT4WVqZqBEI9Kub18gZ3m1D89m.jpg', 4);

-- Batman Trilogia Nolan (3 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000004', '2c191036-27a1-47a8-ba53-fd3acdeb77d7', 'movie', 'Batman Begins', '/7EyhcdfiLtH0xa6CZkyYuoWL2GJ.jpg', 1),
  ('a1000001-0000-0000-0000-000000000004', 'f81a515b-bc4e-4a42-8650-b53ab083e648', 'movie', 'Batman: O Cavaleiro das Trevas', '/4lj1ikfsSmMZNyfdi8R8Tv5tsgb.jpg', 2),
  ('a1000001-0000-0000-0000-000000000004', '77775021-ad6e-4d2c-bdeb-245bcbeeef63', 'movie', 'Batman: O Cavaleiro das Trevas Ressurge', '/j4z01cnbTCaVX69bik1612pSuH6.jpg', 3);

-- Velozes & Furiosos (principais 10)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000005', 'ee1a00d4-b455-4334-bccd-9676d74a8855', 'movie', 'Velozes e Furiosos', '/rKaaYM4CtuJZFdOA0SZWbaMNHbn.jpg', 1),
  ('a1000001-0000-0000-0000-000000000005', '86e2d895-a03d-4679-9a65-58ccb466ea23', 'movie', '+ Velozes + Furiosos', '/mx0CB8H78PQu0g9YUWG47hdi93S.jpg', 2),
  ('a1000001-0000-0000-0000-000000000005', '891dea54-b28d-4795-bcbf-27e5f2e7872d', 'movie', 'Velozes e Furiosos: Desafio em Tóquio', '/1kzW2GImY1YVmLRx3NLhXFBfLLO.jpg', 3),
  ('a1000001-0000-0000-0000-000000000005', 'bedf18a4-52cf-41f7-bb1c-b0602eaeaa56', 'movie', 'Velozes e Furiosos 4', '/7sjbAOmNFtfTyZ6KFC9t9FDDOcK.jpg', 4),
  ('a1000001-0000-0000-0000-000000000005', '601c7ab9-0f8a-47ea-be83-af301d444375', 'movie', 'Velozes & Furiosos 5: Operação Rio', '/5BKmQMUPOEtDFDCBW8jrUCI9ZbI.jpg', 5),
  ('a1000001-0000-0000-0000-000000000005', 'cd6898d0-5776-491d-9859-b453b5314b02', 'movie', 'Velozes & Furiosos 6', '/h8SD0Kkqv3PUBneQX9tFsDrFu8.jpg', 6),
  ('a1000001-0000-0000-0000-000000000005', '0f299d15-69d2-4c74-8c48-dfed82b4a669', 'movie', 'Velozes & Furiosos 7', '/spydMyyD81HjGJVwZvjajkrWW1h.jpg', 7),
  ('a1000001-0000-0000-0000-000000000005', '6e2cc060-3c42-45da-97b2-ccc533de3f21', 'movie', 'Velozes & Furiosos 8', '/38RVo4cX1O7Ia6k9WXcxkxprHm.jpg', 8),
  ('a1000001-0000-0000-0000-000000000005', '0f88f1d6-1d9f-4a65-bdec-61162023d4c7', 'movie', 'Velozes & Furiosos 9', '/6TuEPZ3ItlBO8WmH8BmY2aGLhes.jpg', 9),
  ('a1000001-0000-0000-0000-000000000005', 'db9edc34-099d-4a9b-a9f1-b2dc52dbbc3f', 'movie', 'Velozes & Furiosos 10', '/xNqt1Om0IlUhDOjZRCL5ewoazVV.jpg', 10);

-- Transformers (6 filmes principais)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000006', '247b3c1b-0873-40f0-b4d6-42ddd50b097b', 'movie', 'Transformers', '/lkZ9gqCEjzX85lKR6Jjd1uGAXNp.jpg', 1),
  ('a1000001-0000-0000-0000-000000000006', '4c44db52-63fb-4e5e-a787-e33cb136c9e0', 'movie', 'Transformers: A Vingança dos Derrotados', '/xggdkMUwiY4zwlSXbp7AqPxAvQt.jpg', 2),
  ('a1000001-0000-0000-0000-000000000006', '2bd31c4e-2996-446a-975d-8d8eef6ac39c', 'movie', 'Transformers: O Lado Oculto da Lua', '/2ClU228vymaJqDRr4ViXQXjwYse.jpg', 3),
  ('a1000001-0000-0000-0000-000000000006', '564e27d9-0e8f-427c-9e86-aef420525727', 'movie', 'Transformers: A Era da Extinção', '/cLNIRQ2oyJhaUId41aGmSDfD5MI.jpg', 4),
  ('a1000001-0000-0000-0000-000000000006', 'c586d779-5259-4f8b-9a69-b52130e7491c', 'movie', 'Transformers: O Último Cavaleiro', '/7ugUPQw8JjGazfd28MIPADvDaUT.jpg', 5),
  ('a1000001-0000-0000-0000-000000000006', '59064676-421c-480f-b337-cd68d02a658d', 'movie', 'Transformers: O Despertar das Feras', '/9PSKoY98olv7Sru1PWnLpFDqat9.jpg', 6),
  ('a1000001-0000-0000-0000-000000000006', '0f58b2ce-af67-4a9a-899e-da8af40f706b', 'movie', 'Transformers: O Início', '/9yPuNAZQd5m5iKpQV2MDAfcwW9N.jpg', 7);

-- Toy Story (4 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000007', 'd5a8b4a9-ccb3-40d6-8356-677469620a81', 'movie', 'Toy Story: Um Mundo de Aventuras', '/6AafgfifXkFS4g2xGJZIwsPQK6P.jpg', 1),
  ('a1000001-0000-0000-0000-000000000007', 'df9592cc-e530-4f12-9730-7b39f262d16e', 'movie', 'Toy Story 2', '/xVhEI1WCgNCCa5I86AqiwuZoog3.jpg', 2),
  ('a1000001-0000-0000-0000-000000000007', '1aaa469c-2a31-4ab6-aa23-960449a93f91', 'movie', 'Toy Story 3', '/rf67AeS9nP8DD7dZYbvhjEVoIBf.jpg', 3),
  ('a1000001-0000-0000-0000-000000000007', '0e10d806-43fe-442e-812a-c5adedfd0a22', 'movie', 'Toy Story 4', '/csiyO6q8rR74pfgJDjwINzhoick.jpg', 4);

-- Jurassic Park/World (6 filmes)
INSERT INTO public.marathon_items (marathon_id, content_id, content_type, title, poster_path, position) VALUES
  ('a1000001-0000-0000-0000-000000000008', '5fbe7a87-2a87-48f8-b76f-cb6763f16da7', 'movie', 'Jurassic Park: O Parque dos Dinossauros', '/mgjJ7FH4V3exsmoHwXrmsUhn0h1.jpg', 1),
  ('a1000001-0000-0000-0000-000000000008', '17cb173f-3256-45be-b24d-ca0be491b323', 'movie', 'O Mundo Perdido: Jurassic Park', '/gkF6JPfru2FEIP9du7QyHVLSOzu.jpg', 2),
  ('a1000001-0000-0000-0000-000000000008', '8e74f2b2-6dac-4065-ba9f-281e20c31b26', 'movie', 'Jurassic Park 3', '/1dObEUGvS4cTbVNi8ewvd6gLIv4.jpg', 3),
  ('a1000001-0000-0000-0000-000000000008', 'da61ed9b-c143-4b68-a151-aa395d1feadb', 'movie', 'Jurassic World: O Mundo dos Dinossauros', '/mTRLIP4J4iJrVbJplKiaGnc3G93.jpg', 4),
  ('a1000001-0000-0000-0000-000000000008', 'ca51d326-a5a0-4ee5-95d8-0ac933b704a6', 'movie', 'Jurassic World: Reino Ameaçado', '/pi23N55j5ezB2wvybgAFuSGrVHB.jpg', 5),
  ('a1000001-0000-0000-0000-000000000008', '74d13be3-db4d-4ca9-8b9f-cc3ce936bd42', 'movie', 'Jurassic World: Domínio', '/7qeiCNSmzrkcEyIWi8sIcsjrOyW.jpg', 6);
