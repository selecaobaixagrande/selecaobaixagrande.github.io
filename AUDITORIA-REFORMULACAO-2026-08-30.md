# Auditoria e reformulação — 30/08/2026

## Backup
- Backup do estado anterior criado antes das alterações: `backup-pre-reformulacao-2026-08-30`.
- O backup aponta para o commit anterior à reformulação e permanece separado da `main`.

## Problemas encontrados

### Interface e arquitetura visual
1. A Home tinha múltiplas camadas de CSS (`style.css`, `visual-profissional.css`, `portal-overrides.css`, CSS inline), criando conflitos de cascata e dificultando manutenção.
2. O portal usava fundo azul/vermelho em páginas internas, enquanto a identidade principal era preta/vermelha.
3. A Home tinha estrutura excessivamente longa e repetitiva, com blocos de portal que não estavam hierarquizados como uma página esportiva profissional.
4. Havia implementações diferentes de menu mobile entre páginas.
5. Havia links e estilos específicos espalhados dentro dos próprios HTMLs, aumentando a chance de inconsistências.

### Dados e conteúdo
1. O jogo de 22/08/2026 contra Mundo Novo estava cadastrado no Supabase como `agendado`, apesar de já ter acontecido.
2. O Supabase continha o placar 0×0 para esse jogo, enquanto o resultado oficial informado é Baixa Grande 0×2 Mundo Novo.
3. A Home tinha 1×2 para esse jogo, divergindo do histórico de resultados.
4. A página de resultados já possuía 0×2, portanto havia inconsistência entre fontes.
5. O link `estatisticas.html` usado anteriormente na Home não fazia parte da estrutura principal auditada; foi removido da nova Home em favor do histórico existente.

### Backend / Supabase
1. Há avisos de segurança para funções `SECURITY DEFINER` públicas: `buscar_email_atleta_por_nome(text)` e `rls_auto_enable()`.
2. Há aviso de proteção contra senhas vazadas desativada no Auth.
3. Há avisos de performance em políticas RLS por reavaliação de `auth.*()` por linha.
4. Há políticas permissivas duplicadas em `avisos`, `escalacoes`, `galeria`, `jogos` e `noticias`.
5. Há índices sem uso detectado em `avisos` e `galeria`.

## Alterações executadas
- Nova linguagem visual global preta/vermelha, com tipografia consistente, cards, espaçamento, navegação e responsividade.
- Home completamente reestruturada em: hero, último resultado, atalhos principais, notícias, números da temporada e galeria.
- Página de entrada (`index.html`) alinhada à nova identidade.
- Fundo azul removido das páginas que utilizavam `portal-overrides.css`.
- Menu mobile global padronizado.
- Resultado de 22/08/2026 corrigido no Supabase para encerrado, 0×2, Copa Regional de Futsal Feminino 2026 e local Ginásio de Esportes - Mairi.
- Nova Home mostra o mesmo placar 0×2, evitando divergência entre interface e banco.

## Preservação
- Conteúdo existente, páginas, autenticação, tabelas e estrutura do Supabase foram preservados.
- Nenhuma tabela foi apagada ou recriada.
- O banco não foi resetado.
- O backup do GitHub permite retorno imediato ao estado anterior da reformulação.

## Próxima etapa técnica recomendada
- Revisar as políticas RLS e funções `SECURITY DEFINER` antes de abrir qualquer operação administrativa ao público.
- Ativar proteção contra senhas vazadas no Supabase Auth.
- Consolidar os arquivos CSS remanescentes em uma única folha de estilo quando todas as páginas antigas forem migradas para o novo sistema de componentes.
