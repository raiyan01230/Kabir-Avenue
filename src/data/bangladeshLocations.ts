export interface DivisionData {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    thanas: {
      id: string;
      name: string;
    }[];
  }[];
}

export const BANGLADESH_DIVISIONS: DivisionData[] = [
  {
    id: 'div-dhaka',
    name: 'Dhaka',
    districts: [
      {
        id: 'dist-dhaka',
        name: 'Dhaka',
        thanas: [
          { id: 'th-dhanmondi', name: 'Dhanmondi' },
          { id: 'th-gulshan', name: 'Gulshan' },
          { id: 'th-banani', name: 'Banani' },
          { id: 'th-uttara', name: 'Uttara' },
          { id: 'th-mirpur', name: 'Mirpur' },
          { id: 'th-mohammadpur', name: 'Mohammadpur' },
          { id: 'th-motijheel', name: 'Motijheel' },
          { id: 'th-badda', name: 'Badda' },
          { id: 'th-khilgaon', name: 'Khilgaon' },
          { id: 'th-tejgaon', name: 'Tejgaon' },
          { id: 'th-paltan', name: 'Paltan' },
          { id: 'th-rampura', name: 'Rampura' },
          { id: 'th-bashundhara', name: 'Bashundhara' },
          { id: 'th-lalbagh', name: 'Lalbagh' },
          { id: 'th-savar', name: 'Savar' },
          { id: 'th-keraniganj', name: 'Keraniganj' }
        ]
      },
      {
        id: 'dist-gazipur',
        name: 'Gazipur',
        thanas: [
          { id: 'th-gaz-sadar', name: 'Gazipur Sadar' },
          { id: 'th-tongi', name: 'Tongi' },
          { id: 'th-sreepur', name: 'Sreepur' },
          { id: 'th-kaliakair', name: 'Kaliakair' },
          { id: 'th-kapasia', name: 'Kapasia' }
        ]
      },
      {
        id: 'dist-narayanganj',
        name: 'Narayanganj',
        thanas: [
          { id: 'th-nar-sadar', name: 'Narayanganj Sadar' },
          { id: 'th-siddhirganj', name: 'Siddhirganj' },
          { id: 'th-sonargaon', name: 'Sonargaon' },
          { id: 'th-rupganj', name: 'Rupganj' }
        ]
      },
      {
        id: 'dist-tangail',
        name: 'Tangail',
        thanas: [
          { id: 'th-tang-sadar', name: 'Tangail Sadar' },
          { id: 'th-mirzapur', name: 'Mirzapur' },
          { id: 'th-madhupur', name: 'Madhupur' }
        ]
      },
      {
        id: 'dist-faridpur',
        name: 'Faridpur',
        thanas: [
          { id: 'th-far-sadar', name: 'Faridpur Sadar' },
          { id: 'th-bhanga', name: 'Bhanga' },
          { id: 'th-boalmari', name: 'Boalmari' }
        ]
      }
    ]
  },
  {
    id: 'div-chattogram',
    name: 'Chattogram',
    districts: [
      {
        id: 'dist-chattogram',
        name: 'Chattogram',
        thanas: [
          { id: 'th-kotwali-ctg', name: 'Kotwali' },
          { id: 'th-panchlaish', name: 'Panchlaish' },
          { id: 'th-agrabad', name: 'Agrabad' },
          { id: 'th-khulshi', name: 'Khulshi' },
          { id: 'th-halishahar', name: 'Halishahar' },
          { id: 'th-hathazari', name: 'Hathazari' },
          { id: 'th-sitakunda', name: 'Sitakunda' }
        ]
      },
      {
        id: 'dist-coxsbazar',
        name: 'Cox\'s Bazar',
        thanas: [
          { id: 'th-cox-sadar', name: 'Cox\'s Bazar Sadar' },
          { id: 'th-teknaf', name: 'Teknaf' },
          { id: 'th-ramu', name: 'Ramu' },
          { id: 'th-chakaria', name: 'Chakaria' }
        ]
      },
      {
        id: 'dist-cumilla',
        name: 'Cumilla',
        thanas: [
          { id: 'th-cum-sadar', name: 'Cumilla Sadar' },
          { id: 'th-daudkandi', name: 'Daudkandi' },
          { id: 'th-chandina', name: 'Chandina' }
        ]
      },
      {
        id: 'dist-noakhali',
        name: 'Noakhali',
        thanas: [
          { id: 'th-noa-sadar', name: 'Noakhali Sadar' },
          { id: 'th-begumganj', name: 'Begumganj' },
          { id: 'th-chatkhil', name: 'Chatkhil' }
        ]
      }
    ]
  },
  {
    id: 'div-sylhet',
    name: 'Sylhet',
    districts: [
      {
        id: 'dist-sylhet',
        name: 'Sylhet',
        thanas: [
          { id: 'th-syl-sadar', name: 'Sylhet Sadar' },
          { id: 'th-south-surma', name: 'South Surma' },
          { id: 'th-beanibazar', name: 'Beanibazar' },
          { id: 'th-sreemangal', name: 'Sreemangal' }
        ]
      },
      {
        id: 'dist-moulvibazar',
        name: 'Moulvibazar',
        thanas: [
          { id: 'th-moulvi-sadar', name: 'Moulvibazar Sadar' },
          { id: 'th-kulaura', name: 'Kulaura' }
        ]
      }
    ]
  },
  {
    id: 'div-rajshahi',
    name: 'Rajshahi',
    districts: [
      {
        id: 'dist-rajshahi',
        name: 'Rajshahi',
        thanas: [
          { id: 'th-boalia', name: 'Boalia' },
          { id: 'th-motihar', name: 'Motihar' },
          { id: 'th-rajpara', name: 'Rajpara' },
          { id: 'th-godagari', name: 'Godagari' }
        ]
      },
      {
        id: 'dist-bogura',
        name: 'Bogura',
        thanas: [
          { id: 'th-bog-sadar', name: 'Bogura Sadar' },
          { id: 'th-sherpur', name: 'Sherpur' },
          { id: 'th-shibganj', name: 'Shibganj' }
        ]
      },
      {
        id: 'dist-pabna',
        name: 'Pabna',
        thanas: [
          { id: 'th-pab-sadar', name: 'Pabna Sadar' },
          { id: 'th-ishwardi', name: 'Ishwardi' }
        ]
      }
    ]
  },
  {
    id: 'div-khulna',
    name: 'Khulna',
    districts: [
      {
        id: 'dist-khulna',
        name: 'Khulna',
        thanas: [
          { id: 'th-khu-sadar', name: 'Khulna Sadar' },
          { id: 'th-sonadanga', name: 'Sonadanga' },
          { id: 'th-khalishpur', name: 'Khalishpur' }
        ]
      },
      {
        id: 'dist-jashore',
        name: 'Jashore',
        thanas: [
          { id: 'th-jas-sadar', name: 'Jashore Sadar' },
          { id: 'th-abhaynagar', name: 'Abhaynagar' }
        ]
      },
      {
        id: 'dist-kushtia',
        name: 'Kushtia',
        thanas: [
          { id: 'th-kus-sadar', name: 'Kushtia Sadar' },
          { id: 'th-bheramara', name: 'Bheramara' }
        ]
      }
    ]
  },
  {
    id: 'div-barishal',
    name: 'Barishal',
    districts: [
      {
        id: 'dist-barishal',
        name: 'Barishal',
        thanas: [
          { id: 'th-bar-sadar', name: 'Barishal Sadar' },
          { id: 'th-agailjhara', name: 'Agailjhara' },
          { id: 'th-bakerganj', name: 'Bakerganj' }
        ]
      },
      {
        id: 'dist-bhola',
        name: 'Bhola',
        thanas: [
          { id: 'th-bho-sadar', name: 'Bhola Sadar' },
          { id: 'th-char-fasson', name: 'Char Fasson' }
        ]
      }
    ]
  },
  {
    id: 'div-rangpur',
    name: 'Rangpur',
    districts: [
      {
        id: 'dist-rangpur',
        name: 'Rangpur',
        thanas: [
          { id: 'th-ran-sadar', name: 'Rangpur Sadar' },
          { id: 'th-badarganj', name: 'Badarganj' },
          { id: 'th-pirganj', name: 'Pirganj' }
        ]
      },
      {
        id: 'dist-dinajpur',
        name: 'Dinajpur',
        thanas: [
          { id: 'th-din-sadar', name: 'Dinajpur Sadar' },
          { id: 'th-parbatipur', name: 'Parbatipur' }
        ]
      }
    ]
  },
  {
    id: 'div-mymensingh',
    name: 'Mymensingh',
    districts: [
      {
        id: 'dist-mymensingh',
        name: 'Mymensingh',
        thanas: [
          { id: 'th-mym-sadar', name: 'Mymensingh Sadar' },
          { id: 'th-bhaluka', name: 'Bhaluka' },
          { id: 'th-trishal', name: 'Trishal' }
        ]
      },
      {
        id: 'dist-jamalpur',
        name: 'Jamalpur',
        thanas: [
          { id: 'th-jam-sadar', name: 'Jamalpur Sadar' },
          { id: 'th-sarishabari', name: 'Sarishabari' }
        ]
      }
    ]
  }
];
