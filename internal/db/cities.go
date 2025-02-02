package db

import "log"

type City struct {
	ID          string  `db:"id" json:"id"`
	CityName    string  `db:"city_name" json:"city_name"`
	CountryCode string  `db:"country_code" json:"country_code"`
	Latitude    float64 `db:"latitude" json:"latitude"`
	Longitude   float64 `db:"longitude" json:"longitude"`
}

func (s *storage) SearchCities(query string) ([]City, error) {
	sqlQuery := `
		SELECT id, city_name, country_code, latitude, longitude
		FROM cities
		WHERE city_name LIKE ?
		ORDER BY population DESC
		LIMIT 10
	`

	searchTerm := "%" + query + "%"
	rows, err := s.db.Query(sqlQuery, searchTerm)
	if err != nil {
		log.Println("Error executing query:", err)
		return nil, err
	}
	defer rows.Close()

	var cities []City
	for rows.Next() {
		var city City
		if err := rows.Scan(
			&city.ID,
			&city.CityName,
			&city.CountryCode,
			&city.Latitude,
			&city.Longitude,
		); err != nil {
			return nil, err
		}
		cities = append(cities, city)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return cities, nil
}
