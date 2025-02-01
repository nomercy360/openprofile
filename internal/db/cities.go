package db

type City struct {
	ID          string  `db:"id" json:"id"`
	CityName    string  `db:"city_name" json:"city_name"`
	CountryCode string  `db:"country_code" json:"country_code"`
	Latitude    float64 `db:"latitude" json:"latitude"`
	Longitude   float64 `db:"longitude" json:"longitude"`
}

func (s *storage) SearchCities(query string) ([]City, error) {
	cities := make([]City, 0)

	err := s.db.Select(&cities, `
		SELECT c.id, c.city_name, c.country_code, c.latitude, c.longitude
		FROM cities c
		WHERE c.city_name ILIKE $1
		ORDER BY c.population DESC LIMIT 10`, "%"+query+"%")

	if err != nil {
		return cities, nil
	}

	return cities, nil
}
