namespace backend.Models {
    public class User {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public User()
        {
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
