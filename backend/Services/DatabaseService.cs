using backend.Models;
using LiteDB;

namespace backend.Services {
    public sealed class DatabaseService : IDisposable {

        private readonly string datapasePath = "./Database.db";
        private readonly LiteDatabase db;

        public DatabaseService()
        {
            db = new LiteDatabase(datapasePath);
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            col.EnsureIndex(x => x.AuthToken);
        }

        public void Dispose() {
            db.Dispose();
        }

        public void AddUser(User user) {
            var col = db.GetCollection<User>();
            col.Insert(user);
        }

        /// <summary>
        /// Retorna o objeto inteiro do usuario a partir de seu id
        /// </summary>
        /// <param name="id">O id do usuario</param>
        /// <returns>O usuario ou null se o id nao existe</returns>
        public User? GetUser(Guid id) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            User? user = col.Query()
                .Where(x => x.Id == id)
                .FirstOrDefault();
            if (user is null) {
                return null;
            }
            return user;
        }

        /// <summary>
        /// Muda a senha de um usuario.
        /// </summary>
        /// <param name="id">O id do usuario</param>
        /// <param name="password">A nova senha deste usuario</param>
        public void SetUserPassword(Guid id, string password) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            User? user = col.Query()
                .Where(x => x.Id == id)
                .FirstOrDefault();
            if (user is null) {
                return;
            }
            user.Password = password;
            col.Update(user);
        }


        /// <summary>
        /// Retorna o token de autenticacao atual deste usuario.
        /// </summary>
        /// <param name="id">O id do usuario</param>
        /// <returns>O token de autenticacao ou <see langword="null"/> se o usuario nao existe</returns>
        public string? GetUserToken(Guid id) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            User? user = col.Query()
                .Where(x => x.Id == id)
                .FirstOrDefault();
            if (user is null) {
                return null;
            }
            return user.AuthToken;
        }

        /// <summary>
        /// Seta o token de autenticacao novo do usuario.
        /// Se o usuario nao existe, falha silenciosamente.
        /// </summary>
        /// <param name="id">O id do usuario</param>
        /// <param name="token">O novo token</param>
        public void SetUserToken(Guid id, string token) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            User? user = col.Query()
                .Where(x => x.Id == id)
                .FirstOrDefault();
            if(user is null) {
                return;
            }
            user.AuthToken = token;
            col.Update(user);
        }

        /// <summary>
        /// Retorna o id unico do usuario
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        public Guid? GetUserId(string username) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.Id);
            User? user = col.Query()
                .Where(x => x.Name == username)
                .FirstOrDefault();

            if (user is null) {
                return null;
            }

            return user.Id;
        }

        /// <summary>
        /// Retorna um token de autenticacao aleatorio criado
        /// a partir de um <see cref="Guid"/> aleatorio.
        /// </summary>
        /// <returns>O token gerado como string</returns>
        public static string GenerateAuthToken() {
            var token = Guid.NewGuid().ToString();
            return token;
        }

        /// <summary>
        /// Procura um usuario pelo token de autenticacao.
        /// </summary>
        /// <param name="token">o token de autenticacao</param>
        /// <returns>O Id do usuario ou <see cref="Guid.Empty"/> caso esse
        /// token nao exista</returns>
        public Guid GetUserByToken(string token) {
            var col = db.GetCollection<User>();
            col.EnsureIndex(x => x.AuthToken);
            User? user = col.Query()
                .Where(x => x.AuthToken == token)
                .FirstOrDefault();
            if (user is null) {
                return Guid.Empty;
            }
            return user.Id;
        }
    }
}
